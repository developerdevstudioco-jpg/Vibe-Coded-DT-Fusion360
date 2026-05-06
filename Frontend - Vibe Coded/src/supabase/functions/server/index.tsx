import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { createClient } from "@supabase/supabase-js";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Initialize Supabase clients
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';

// Service role client for admin operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Helper to get authenticated user
async function getAuthenticatedUser(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    return { user: null, error: 'No authorization header' };
  }

  const token = authHeader.replace('Bearer ', '');
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    return { user: null, error: 'Unauthorized' };
  }

  return { user, error: null };
}

// Helper to get user details from metadata
async function getUserDetails(userId: string) {
  const userDataKey = `user:${userId}`;
  const userData = await kv.get(userDataKey);
  return userData;
}

// Helper to check plant access
function hasPlantAccess(userPlants: string[], plant: string, userRole: string): boolean {
  if (userRole === 'SuperAdmin') return true;
  if (Array.isArray(userPlants)) {
    return userPlants.includes(plant);
  }
  return userPlants === plant;
}

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// ============= HEALTH CHECK =============
app.get("/make-server-767ffd61/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ============= AUTHENTICATION ROUTES =============

// Sign up new user
app.post("/make-server-767ffd61/auth/signup", async (c) => {
  try {
    const body = await c.req.json();
    const { email, password, name, role, department, plant, plants } = body;

    // Validate required fields
    if (!email || !password || !name || !role || !department || !plant) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    // Create user in Supabase Auth
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm since email server not configured
      user_metadata: {
        name,
        role,
        department,
        plant,
        plants: plants || [plant],
        isActive: true,
        createdAt: new Date().toISOString()
      }
    });

    if (error) {
      console.log(`Auth error during user signup for ${email}: ${error.message}`);
      return c.json({ error: error.message }, 400);
    }

    // Store additional user data in KV store
    const userId = data.user.id;
    await kv.set(`user:${userId}`, {
      id: userId,
      email,
      name,
      role,
      department,
      plant,
      plants: plants || [plant],
      isActive: true,
      createdAt: new Date().toISOString()
    });

    // Create audit log
    await kv.set(`audit:${Date.now()}:signup:${userId}`, {
      action: 'user_signup',
      userId,
      email,
      role,
      timestamp: new Date().toISOString()
    });

    return c.json({ 
      success: true, 
      user: { 
        id: userId, 
        email, 
        name, 
        role, 
        department, 
        plant,
        plants: plants || [plant]
      } 
    });

  } catch (err) {
    console.log(`Server error during signup: ${err}`);
    return c.json({ error: 'Internal server error during signup' }, 500);
  }
});

// Sign in user
app.post("/make-server-767ffd61/auth/signin", async (c) => {
  try {
    const body = await c.req.json();
    const { email, password } = body;

    if (!email || !password) {
      return c.json({ error: 'Email and password required' }, 400);
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.log(`Auth error during sign in for ${email}: ${error.message}`);
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    const userId = data.user.id;
    const userData = await kv.get(`user:${userId}`);

    // Create audit log
    await kv.set(`audit:${Date.now()}:signin:${userId}`, {
      action: 'user_signin',
      userId,
      email,
      timestamp: new Date().toISOString()
    });

    return c.json({ 
      success: true, 
      session: data.session,
      user: userData || data.user.user_metadata
    });

  } catch (err) {
    console.log(`Server error during sign in: ${err}`);
    return c.json({ error: 'Internal server error during sign in' }, 500);
  }
});

// Get current user session
app.get("/make-server-767ffd61/auth/user", async (c) => {
  try {
    const { user, error } = await getAuthenticatedUser(c.req.raw);
    
    if (error || !user) {
      return c.json({ error: error || 'Unauthorized' }, 401);
    }

    const userData = await kv.get(`user:${user.id}`);
    
    return c.json({ 
      success: true, 
      user: userData || user.user_metadata 
    });

  } catch (err) {
    console.log(`Server error fetching user: ${err}`);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Sign out
app.post("/make-server-767ffd61/auth/signout", async (c) => {
  try {
    const { user, error } = await getAuthenticatedUser(c.req.raw);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Create audit log
    await kv.set(`audit:${Date.now()}:signout:${user.id}`, {
      action: 'user_signout',
      userId: user.id,
      timestamp: new Date().toISOString()
    });

    return c.json({ success: true });

  } catch (err) {
    console.log(`Server error during sign out: ${err}`);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// ============= USER MANAGEMENT ROUTES =============

// Get all users (SuperAdmin only)
app.get("/make-server-767ffd61/users", async (c) => {
  try {
    const { user, error } = await getAuthenticatedUser(c.req.raw);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userData = await getUserDetails(user.id);
    
    if (userData?.role !== 'SuperAdmin' && userData?.role !== 'PlantAdmin') {
      return c.json({ error: 'Forbidden: Insufficient permissions' }, 403);
    }

    const allUsers = await kv.getByPrefix('user:');
    
    // Filter users by plant access for PlantAdmin
    let filteredUsers = allUsers;
    if (userData?.role === 'PlantAdmin') {
      const userPlants = userData.plants || [userData.plant];
      filteredUsers = allUsers.filter((u: any) => {
        const targetPlant = u.plant;
        return userPlants.includes(targetPlant);
      });
    }

    return c.json({ success: true, users: filteredUsers });

  } catch (err) {
    console.log(`Server error fetching users: ${err}`);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Update user
app.put("/make-server-767ffd61/users/:userId", async (c) => {
  try {
    const { user, error } = await getAuthenticatedUser(c.req.raw);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userData = await getUserDetails(user.id);
    
    if (userData?.role !== 'SuperAdmin' && userData?.role !== 'PlantAdmin') {
      return c.json({ error: 'Forbidden: Insufficient permissions' }, 403);
    }

    const targetUserId = c.req.param('userId');
    const updates = await c.req.json();

    const existingUser = await kv.get(`user:${targetUserId}`);
    if (!existingUser) {
      return c.json({ error: 'User not found' }, 404);
    }

    const updatedUser = {
      ...existingUser,
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedBy: user.id
    };

    await kv.set(`user:${targetUserId}`, updatedUser);

    // Create audit log
    await kv.set(`audit:${Date.now()}:user_update:${targetUserId}`, {
      action: 'user_update',
      userId: user.id,
      targetUserId,
      changes: updates,
      timestamp: new Date().toISOString()
    });

    return c.json({ success: true, user: updatedUser });

  } catch (err) {
    console.log(`Server error updating user: ${err}`);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// ============= PROJECT ROUTES =============

// Get all projects (filtered by plant)
app.get("/make-server-767ffd61/projects", async (c) => {
  try {
    const { user, error } = await getAuthenticatedUser(c.req.raw);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userData = await getUserDetails(user.id);
    const allProjects = await kv.getByPrefix('project:');

    // Filter projects based on plant access
    const userPlants = userData?.plants || [userData?.plant];
    const accessibleProjects = allProjects.filter((project: any) => {
      if (userData?.role === 'SuperAdmin') return true;
      return userPlants.includes(project.plant);
    });

    return c.json({ success: true, projects: accessibleProjects });

  } catch (err) {
    console.log(`Server error fetching projects: ${err}`);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get single project
app.get("/make-server-767ffd61/projects/:projectId", async (c) => {
  try {
    const { user, error } = await getAuthenticatedUser(c.req.raw);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const projectId = c.req.param('projectId');
    const project = await kv.get(`project:${projectId}`);

    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    const userData = await getUserDetails(user.id);
    const userPlants = userData?.plants || [userData?.plant];

    // Check plant access
    if (userData?.role !== 'SuperAdmin' && !userPlants.includes(project.plant)) {
      return c.json({ error: 'Forbidden: No access to this plant' }, 403);
    }

    return c.json({ success: true, project });

  } catch (err) {
    console.log(`Server error fetching project: ${err}`);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Create project
app.post("/make-server-767ffd61/projects", async (c) => {
  try {
    const { user, error } = await getAuthenticatedUser(c.req.raw);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userData = await getUserDetails(user.id);
    const projectData = await c.req.json();

    // Validate plant access
    const userPlants = userData?.plants || [userData?.plant];
    if (userData?.role !== 'SuperAdmin' && !userPlants.includes(projectData.plant)) {
      return c.json({ error: 'Forbidden: Cannot create project in this plant' }, 403);
    }

    const projectId = `${projectData.partCode || Date.now()}`;
    const newProject = {
      ...projectData,
      id: projectId,
      createdBy: user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await kv.set(`project:${projectId}`, newProject);

    // Create audit log
    await kv.set(`audit:${Date.now()}:project_create:${projectId}`, {
      action: 'project_create',
      userId: user.id,
      projectId,
      plant: projectData.plant,
      timestamp: new Date().toISOString()
    });

    return c.json({ success: true, project: newProject });

  } catch (err) {
    console.log(`Server error creating project: ${err}`);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Update project
app.put("/make-server-767ffd61/projects/:projectId", async (c) => {
  try {
    const { user, error } = await getAuthenticatedUser(c.req.raw);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const projectId = c.req.param('projectId');
    const updates = await c.req.json();

    const existingProject = await kv.get(`project:${projectId}`);
    if (!existingProject) {
      return c.json({ error: 'Project not found' }, 404);
    }

    const userData = await getUserDetails(user.id);
    const userPlants = userData?.plants || [userData?.plant];

    // Check plant access
    if (userData?.role !== 'SuperAdmin' && !userPlants.includes(existingProject.plant)) {
      return c.json({ error: 'Forbidden: No access to this plant' }, 403);
    }

    const updatedProject = {
      ...existingProject,
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedBy: user.id
    };

    await kv.set(`project:${projectId}`, updatedProject);

    // Create audit log
    await kv.set(`audit:${Date.now()}:project_update:${projectId}`, {
      action: 'project_update',
      userId: user.id,
      projectId,
      changes: updates,
      timestamp: new Date().toISOString()
    });

    return c.json({ success: true, project: updatedProject });

  } catch (err) {
    console.log(`Server error updating project: ${err}`);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// ============= FORMS ROUTES =============

// Get all forms (filtered by plant)
app.get("/make-server-767ffd61/forms", async (c) => {
  try {
    const { user, error } = await getAuthenticatedUser(c.req.raw);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userData = await getUserDetails(user.id);
    const type = c.req.query('type'); // ucl, ft, machine
    
    const allForms = await kv.getByPrefix('form:');

    // Filter by type and plant access
    const userPlants = userData?.plants || [userData?.plant];
    const accessibleForms = allForms.filter((form: any) => {
      const typeMatch = !type || form.type === type;
      const plantMatch = userData?.role === 'SuperAdmin' || userPlants.includes(form.plant);
      return typeMatch && plantMatch;
    });

    return c.json({ success: true, forms: accessibleForms });

  } catch (err) {
    console.log(`Server error fetching forms: ${err}`);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Create form
app.post("/make-server-767ffd61/forms", async (c) => {
  try {
    const { user, error } = await getAuthenticatedUser(c.req.raw);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userData = await getUserDetails(user.id);
    const formData = await c.req.json();

    // Get project to determine plant
    const project = await kv.get(`project:${formData.project}`);
    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    // Validate plant access
    const userPlants = userData?.plants || [userData?.plant];
    if (userData?.role !== 'SuperAdmin' && !userPlants.includes(project.plant)) {
      return c.json({ error: 'Forbidden: Cannot create form in this plant' }, 403);
    }

    const formId = `form-${Date.now()}`;
    const newForm = {
      ...formData,
      id: formId,
      plant: project.plant,
      createdBy: user.id,
      createdByName: userData?.name,
      createdAt: new Date().toISOString(),
      status: formData.status || 'Pending'
    };

    await kv.set(`form:${formId}`, newForm);

    // Create audit log
    await kv.set(`audit:${Date.now()}:form_create:${formId}`, {
      action: 'form_create',
      userId: user.id,
      formId,
      type: formData.type,
      project: formData.project,
      timestamp: new Date().toISOString()
    });

    return c.json({ success: true, form: newForm });

  } catch (err) {
    console.log(`Server error creating form: ${err}`);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Bulk upload forms
app.post("/make-server-767ffd61/forms/bulk", async (c) => {
  try {
    const { user, error } = await getAuthenticatedUser(c.req.raw);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userData = await getUserDetails(user.id);
    const { forms: formsArray } = await c.req.json();

    if (!Array.isArray(formsArray) || formsArray.length === 0) {
      return c.json({ error: 'Invalid forms array' }, 400);
    }

    const createdForms = [];
    
    for (const formData of formsArray) {
      // Get project to determine plant
      const project = await kv.get(`project:${formData.project}`);
      if (!project) continue;

      // Validate plant access
      const userPlants = userData?.plants || [userData?.plant];
      if (userData?.role !== 'SuperAdmin' && !userPlants.includes(project.plant)) {
        continue;
      }

      const formId = `form-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newForm = {
        ...formData,
        id: formId,
        plant: project.plant,
        createdBy: user.id,
        createdByName: userData?.name,
        createdAt: new Date().toISOString(),
        status: formData.status || 'Pending'
      };

      await kv.set(`form:${formId}`, newForm);
      createdForms.push(newForm);
    }

    // Create audit log
    await kv.set(`audit:${Date.now()}:forms_bulk_upload`, {
      action: 'forms_bulk_upload',
      userId: user.id,
      count: createdForms.length,
      timestamp: new Date().toISOString()
    });

    return c.json({ success: true, forms: createdForms, count: createdForms.length });

  } catch (err) {
    console.log(`Server error in bulk upload: ${err}`);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Update form
app.put("/make-server-767ffd61/forms/:formId", async (c) => {
  try {
    const { user, error } = await getAuthenticatedUser(c.req.raw);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const formId = c.req.param('formId');
    const updates = await c.req.json();

    const existingForm = await kv.get(`form:${formId}`);
    if (!existingForm) {
      return c.json({ error: 'Form not found' }, 404);
    }

    const userData = await getUserDetails(user.id);
    const userPlants = userData?.plants || [userData?.plant];

    // Check plant access
    if (userData?.role !== 'SuperAdmin' && !userPlants.includes(existingForm.plant)) {
      return c.json({ error: 'Forbidden: No access to this plant' }, 403);
    }

    const updatedForm = {
      ...existingForm,
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedBy: user.id
    };

    await kv.set(`form:${formId}`, updatedForm);

    // Create audit log
    await kv.set(`audit:${Date.now()}:form_update:${formId}`, {
      action: 'form_update',
      userId: user.id,
      formId,
      changes: updates,
      timestamp: new Date().toISOString()
    });

    return c.json({ success: true, form: updatedForm });

  } catch (err) {
    console.log(`Server error updating form: ${err}`);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// ============= TASKS ROUTES =============

// Get all tasks (filtered by plant)
app.get("/make-server-767ffd61/tasks", async (c) => {
  try {
    const { user, error } = await getAuthenticatedUser(c.req.raw);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userData = await getUserDetails(user.id);
    const projectId = c.req.query('projectId');
    
    const allTasks = await kv.getByPrefix('task:');

    // Filter by project and plant access
    const userPlants = userData?.plants || [userData?.plant];
    const accessibleTasks = allTasks.filter((task: any) => {
      const projectMatch = !projectId || task.projectId === projectId;
      const plantMatch = userData?.role === 'SuperAdmin' || userPlants.includes(task.plant);
      return projectMatch && plantMatch;
    });

    return c.json({ success: true, tasks: accessibleTasks });

  } catch (err) {
    console.log(`Server error fetching tasks: ${err}`);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Create task
app.post("/make-server-767ffd61/tasks", async (c) => {
  try {
    const { user, error } = await getAuthenticatedUser(c.req.raw);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userData = await getUserDetails(user.id);
    const taskData = await c.req.json();

    // Get project to determine plant
    const project = await kv.get(`project:${taskData.projectId}`);
    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    // Validate plant access
    const userPlants = userData?.plants || [userData?.plant];
    if (userData?.role !== 'SuperAdmin' && !userPlants.includes(project.plant)) {
      return c.json({ error: 'Forbidden: Cannot create task in this plant' }, 403);
    }

    const taskId = `task-${Date.now()}`;
    const newTask = {
      ...taskData,
      id: taskId,
      plant: project.plant,
      createdBy: user.id,
      createdAt: new Date().toISOString(),
      status: taskData.status || 'Not Started'
    };

    await kv.set(`task:${taskId}`, newTask);

    // Create audit log
    await kv.set(`audit:${Date.now()}:task_create:${taskId}`, {
      action: 'task_create',
      userId: user.id,
      taskId,
      projectId: taskData.projectId,
      timestamp: new Date().toISOString()
    });

    return c.json({ success: true, task: newTask });

  } catch (err) {
    console.log(`Server error creating task: ${err}`);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Update task
app.put("/make-server-767ffd61/tasks/:taskId", async (c) => {
  try {
    const { user, error } = await getAuthenticatedUser(c.req.raw);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const taskId = c.req.param('taskId');
    const updates = await c.req.json();

    const existingTask = await kv.get(`task:${taskId}`);
    if (!existingTask) {
      return c.json({ error: 'Task not found' }, 404);
    }

    const userData = await getUserDetails(user.id);
    const userPlants = userData?.plants || [userData?.plant];

    // Check plant access
    if (userData?.role !== 'SuperAdmin' && !userPlants.includes(existingTask.plant)) {
      return c.json({ error: 'Forbidden: No access to this plant' }, 403);
    }

    const updatedTask = {
      ...existingTask,
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedBy: user.id
    };

    await kv.set(`task:${taskId}`, updatedTask);

    // Create audit log
    await kv.set(`audit:${Date.now()}:task_update:${taskId}`, {
      action: 'task_update',
      userId: user.id,
      taskId,
      changes: updates,
      timestamp: new Date().toISOString()
    });

    return c.json({ success: true, task: updatedTask });

  } catch (err) {
    console.log(`Server error updating task: ${err}`);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// ============= AUDIT LOG ROUTES =============

// Get audit logs (SuperAdmin only)
app.get("/make-server-767ffd61/audit-logs", async (c) => {
  try {
    const { user, error } = await getAuthenticatedUser(c.req.raw);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userData = await getUserDetails(user.id);
    
    if (userData?.role !== 'SuperAdmin') {
      return c.json({ error: 'Forbidden: SuperAdmin access required' }, 403);
    }

    const logs = await kv.getByPrefix('audit:');
    
    // Sort by timestamp descending
    const sortedLogs = logs.sort((a: any, b: any) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    return c.json({ success: true, logs: sortedLogs });

  } catch (err) {
    console.log(`Server error fetching audit logs: ${err}`);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// ============= STATISTICS ROUTES =============

// Get dashboard statistics
app.get("/make-server-767ffd61/stats/dashboard", async (c) => {
  try {
    const { user, error } = await getAuthenticatedUser(c.req.raw);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userData = await getUserDetails(user.id);
    const userPlants = userData?.plants || [userData?.plant];

    // Get all data
    const allProjects = await kv.getByPrefix('project:');
    const allTasks = await kv.getByPrefix('task:');
    const allForms = await kv.getByPrefix('form:');

    // Filter by plant access
    const projects = allProjects.filter((p: any) => 
      userData?.role === 'SuperAdmin' || userPlants.includes(p.plant)
    );

    const tasks = allTasks.filter((t: any) => 
      userData?.role === 'SuperAdmin' || userPlants.includes(t.plant)
    );

    const forms = allForms.filter((f: any) => 
      userData?.role === 'SuperAdmin' || userPlants.includes(f.plant)
    );

    // Calculate statistics
    const stats = {
      totalProjects: projects.length,
      activeProjects: projects.filter((p: any) => p.status !== 'Completed').length,
      totalTasks: tasks.length,
      completedTasks: tasks.filter((t: any) => t.status === 'Completed').length,
      pendingTasks: tasks.filter((t: any) => t.status !== 'Completed').length,
      totalForms: forms.length,
      pendingForms: forms.filter((f: any) => f.status === 'Pending').length,
      approvedForms: forms.filter((f: any) => f.status === 'Approved').length
    };

    return c.json({ success: true, stats });

  } catch (err) {
    console.log(`Server error fetching statistics: ${err}`);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// ============= MESSAGE HUB ROUTES =============

// Get channels for user (filtered by department and plant)
app.get("/make-server-767ffd61/messages/channels", async (c) => {
  try {
    const { user, error } = await getAuthenticatedUser(c.req.raw);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userData = await getUserDetails(user.id);
    const allChannels = await kv.getByPrefix('channel:');
    
    // Filter channels based on user's department and plant
    const userDepts = Array.isArray(userData?.department) ? userData.department : [userData?.department];
    const userPlants = userData?.plants || [userData?.plant];
    
    const accessibleChannels = allChannels.filter((channel: any) => {
      // SuperAdmin sees all channels
      if (userData?.role === 'SuperAdmin') return true;
      
      // Check plant access
      const plantMatch = !channel.plant || userPlants.includes(channel.plant);
      
      // Check department access
      const deptMatch = !channel.allowedDepts || 
        userDepts.some((dept: string) => channel.allowedDepts.includes(dept));
      
      return plantMatch && deptMatch;
    });

    return c.json({ success: true, channels: accessibleChannels });

  } catch (err) {
    console.log(`Server error fetching channels: ${err}`);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Create a new channel (Admin/Manager only)
app.post("/make-server-767ffd61/messages/channels", async (c) => {
  try {
    const { user, error } = await getAuthenticatedUser(c.req.raw);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userData = await getUserDetails(user.id);
    
    // Only admins and managers can create channels
    const allowedRoles = ['SuperAdmin', 'PlantAdmin', 'Manager', 'AGM', 'GM', 'DGM'];
    if (!allowedRoles.includes(userData?.role)) {
      return c.json({ error: 'Forbidden: Insufficient permissions' }, 403);
    }

    const channelData = await c.req.json();
    const { name, type, allowedDepts, projectId } = channelData;

    const channelId = `channel-${Date.now()}`;
    const newChannel = {
      id: channelId,
      name,
      type, // 'project', 'department', 'general'
      allowedDepts: allowedDepts || [],
      plant: userData?.plant,
      projectId: projectId || null,
      createdBy: user.id,
      createdByName: userData?.name,
      createdAt: new Date().toISOString(),
      unread: 0
    };

    await kv.set(`channel:${channelId}`, newChannel);

    // Create audit log
    await kv.set(`audit:${Date.now()}:channel_create:${channelId}`, {
      action: 'channel_create',
      userId: user.id,
      channelId,
      channelName: name,
      timestamp: new Date().toISOString()
    });

    return c.json({ success: true, channel: newChannel });

  } catch (err) {
    console.log(`Server error creating channel: ${err}`);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get messages for a channel
app.get("/make-server-767ffd61/messages/channels/:channelId/messages", async (c) => {
  try {
    const { user, error } = await getAuthenticatedUser(c.req.raw);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const channelId = c.req.param('channelId');
    const channel = await kv.get(`channel:${channelId}`);

    if (!channel) {
      return c.json({ error: 'Channel not found' }, 404);
    }

    // Verify user has access to this channel
    const userData = await getUserDetails(user.id);
    const userDepts = Array.isArray(userData?.department) ? userData.department : [userData?.department];
    const userPlants = userData?.plants || [userData?.plant];
    
    const hasAccess = userData?.role === 'SuperAdmin' ||
      ((!channel.plant || userPlants.includes(channel.plant)) &&
       (!channel.allowedDepts || userDepts.some((dept: string) => channel.allowedDepts.includes(dept))));

    if (!hasAccess) {
      return c.json({ error: 'Forbidden: No access to this channel' }, 403);
    }

    // Get all messages for this channel
    const allMessages = await kv.getByPrefix(`message:${channelId}:`);
    
    // Sort by timestamp
    const sortedMessages = allMessages.sort((a: any, b: any) => {
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    });

    return c.json({ success: true, messages: sortedMessages });

  } catch (err) {
    console.log(`Server error fetching messages: ${err}`);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Send a message to a channel
app.post("/make-server-767ffd61/messages/channels/:channelId/messages", async (c) => {
  try {
    const { user, error } = await getAuthenticatedUser(c.req.raw);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const channelId = c.req.param('channelId');
    const { message, attachments } = await c.req.json();

    if (!message || message.trim() === '') {
      return c.json({ error: 'Message cannot be empty' }, 400);
    }

    const channel = await kv.get(`channel:${channelId}`);
    if (!channel) {
      return c.json({ error: 'Channel not found' }, 404);
    }

    // Verify user has access to this channel
    const userData = await getUserDetails(user.id);
    const userDepts = Array.isArray(userData?.department) ? userData.department : [userData?.department];
    const userPlants = userData?.plants || [userData?.plant];
    
    const hasAccess = userData?.role === 'SuperAdmin' ||
      ((!channel.plant || userPlants.includes(channel.plant)) &&
       (!channel.allowedDepts || userDepts.some((dept: string) => channel.allowedDepts.includes(dept))));

    if (!hasAccess) {
      return c.json({ error: 'Forbidden: No access to this channel' }, 403);
    }

    const messageId = `message:${channelId}:${Date.now()}`;
    const newMessage = {
      id: messageId,
      channelId,
      userId: user.id,
      userName: userData?.name || 'Unknown User',
      userRole: userData?.role,
      message: message.trim(),
      attachments: attachments || [],
      reactions: [],
      timestamp: new Date().toISOString()
    };

    await kv.set(messageId, newMessage);

    // Update channel's last message time
    await kv.set(`channel:${channelId}`, {
      ...channel,
      lastMessageAt: new Date().toISOString()
    });

    return c.json({ success: true, message: newMessage });

  } catch (err) {
    console.log(`Server error sending message: ${err}`);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Add reaction to a message
app.post("/make-server-767ffd61/messages/:messageId/reactions", async (c) => {
  try {
    const { user, error } = await getAuthenticatedUser(c.req.raw);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const messageId = c.req.param('messageId');
    const { reaction } = await c.req.json();

    const message = await kv.get(messageId);
    if (!message) {
      return c.json({ error: 'Message not found' }, 404);
    }

    const userData = await getUserDetails(user.id);
    const reactions = message.reactions || [];
    
    // Check if user already reacted with this emoji
    const existingReaction = reactions.find((r: any) => 
      r.emoji === reaction && r.userId === user.id
    );

    let updatedReactions;
    if (existingReaction) {
      // Remove reaction
      updatedReactions = reactions.filter((r: any) => 
        !(r.emoji === reaction && r.userId === user.id)
      );
    } else {
      // Add reaction
      updatedReactions = [
        ...reactions,
        {
          emoji: reaction,
          userId: user.id,
          userName: userData?.name
        }
      ];
    }

    const updatedMessage = {
      ...message,
      reactions: updatedReactions
    };

    await kv.set(messageId, updatedMessage);

    return c.json({ success: true, message: updatedMessage });

  } catch (err) {
    console.log(`Server error adding reaction: ${err}`);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// ============= PASSWORD SETUP ROUTES =============

// Generate password setup token (when admin creates user)
app.post("/make-server-767ffd61/auth/generate-setup-token", async (c) => {
  try {
    const { user, error } = await getAuthenticatedUser(c.req.raw);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userData = await getUserDetails(user.id);
    
    // Only admins can generate setup tokens
    if (userData?.role !== 'SuperAdmin' && userData?.role !== 'PlantAdmin') {
      return c.json({ error: 'Forbidden: Admin access required' }, 403);
    }

    const { email, name, role, department, plant, plants } = await c.req.json();

    if (!email || !name || !role || !department || !plant) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    // Check if user already exists
    const allUsers = await kv.getByPrefix('user:');
    const existingUser = allUsers.find((u: any) => u.email === email);
    
    if (existingUser) {
      return c.json({ error: 'User with this email already exists' }, 400);
    }

    // Generate a unique token
    const token = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

    // Create temporary user record
    const tempUserId = `temp-${Date.now()}`;
    const setupData = {
      tempUserId,
      token,
      email,
      name,
      role,
      department,
      plant,
      plants: plants || [plant],
      createdBy: user.id,
      createdByName: userData?.name,
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
      status: 'pending'
    };

    await kv.set(`setup:${token}`, setupData);

    // Create audit log
    await kv.set(`audit:${Date.now()}:setup_token_created:${email}`, {
      action: 'setup_token_created',
      userId: user.id,
      email,
      timestamp: new Date().toISOString()
    });

    // Generate setup link (this would be sent via email in production)
    const setupLink = `/setup-password?token=${token}`;

    return c.json({ 
      success: true, 
      token,
      setupLink,
      expiresAt: expiresAt.toISOString(),
      user: setupData
    });

  } catch (err) {
    console.log(`Server error generating setup token: ${err}`);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Verify password setup token
app.get("/make-server-767ffd61/auth/verify-setup-token/:token", async (c) => {
  try {
    const token = c.req.param('token');
    
    const setupData = await kv.get(`setup:${token}`);
    
    if (!setupData) {
      return c.json({ error: 'Invalid or expired token' }, 400);
    }

    // Check if token is expired
    const expiresAt = new Date(setupData.expiresAt);
    if (expiresAt < new Date()) {
      return c.json({ error: 'Token has expired' }, 400);
    }

    // Check if already used
    if (setupData.status === 'completed') {
      return c.json({ error: 'Token has already been used' }, 400);
    }

    return c.json({ 
      success: true, 
      user: {
        email: setupData.email,
        name: setupData.name,
        role: setupData.role,
        department: setupData.department,
        plant: setupData.plant
      }
    });

  } catch (err) {
    console.log(`Server error verifying token: ${err}`);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Complete password setup
app.post("/make-server-767ffd61/auth/complete-setup", async (c) => {
  try {
    const { token, password } = await c.req.json();

    if (!token || !password) {
      return c.json({ error: 'Token and password are required' }, 400);
    }

    // Validate password strength
    if (password.length < 8) {
      return c.json({ error: 'Password must be at least 8 characters long' }, 400);
    }

    const setupData = await kv.get(`setup:${token}`);
    
    if (!setupData) {
      return c.json({ error: 'Invalid or expired token' }, 400);
    }

    // Check if token is expired
    const expiresAt = new Date(setupData.expiresAt);
    if (expiresAt < new Date()) {
      return c.json({ error: 'Token has expired' }, 400);
    }

    // Check if already used
    if (setupData.status === 'completed') {
      return c.json({ error: 'Token has already been used' }, 400);
    }

    // Create user in Supabase Auth
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: setupData.email,
      password: password,
      email_confirm: true, // Auto-confirm since email server not configured
      user_metadata: {
        name: setupData.name,
        role: setupData.role,
        department: setupData.department,
        plant: setupData.plant,
        plants: setupData.plants,
        isActive: true,
        createdAt: new Date().toISOString()
      }
    });

    if (error) {
      console.log(`Auth error during password setup for ${setupData.email}: ${error.message}`);
      return c.json({ error: error.message }, 400);
    }

    const userId = data.user.id;

    // Store user data in KV store
    await kv.set(`user:${userId}`, {
      id: userId,
      email: setupData.email,
      name: setupData.name,
      role: setupData.role,
      department: setupData.department,
      plant: setupData.plant,
      plants: setupData.plants,
      isActive: true,
      createdAt: new Date().toISOString()
    });

    // Mark setup token as completed
    await kv.set(`setup:${token}`, {
      ...setupData,
      status: 'completed',
      completedAt: new Date().toISOString(),
      userId
    });

    // Create audit log
    await kv.set(`audit:${Date.now()}:password_setup_completed:${userId}`, {
      action: 'password_setup_completed',
      userId,
      email: setupData.email,
      timestamp: new Date().toISOString()
    });

    return c.json({ 
      success: true, 
      message: 'Password setup completed successfully',
      user: { 
        id: userId, 
        email: setupData.email, 
        name: setupData.name, 
        role: setupData.role 
      } 
    });

  } catch (err) {
    console.log(`Server error completing password setup: ${err}`);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Start the server
Deno.serve(app.fetch);
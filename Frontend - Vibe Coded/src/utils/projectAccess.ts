import { Plant, Project, User, UserProfile } from '../types';

const normalizeArray = (value: string | string[] | undefined): string[] => {
  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0);
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    return [value];
  }

  return [];
};

export const getAccessiblePlantIds = (
  user: Pick<User, 'plant' | 'plantIds'>,
  plants: Plant[],
): string[] => {
  const explicitPlantIds = (user.plantIds || []).filter((plantId) => typeof plantId === 'string' && plantId.trim().length > 0);

  if (explicitPlantIds.length > 0) {
    return Array.from(new Set(explicitPlantIds));
  }

  const plantNames = normalizeArray(user.plant);
  return Array.from(
    new Set(
      plants
        .filter((plant) => plantNames.includes(plant.name))
        .map((plant) => plant.id),
    ),
  );
};

export const canAccessProjectPlant = (
  user: Pick<User, 'plant' | 'plantIds'>,
  plants: Plant[],
  project: Pick<Project, 'plantId' | 'plant'>,
): boolean => {
  const accessiblePlantIds = getAccessiblePlantIds(user, plants);

  if (project.plantId) {
    return accessiblePlantIds.includes(project.plantId);
  }

  if (project.plant) {
    return plants.some((plant) => plant.id && accessiblePlantIds.includes(plant.id) && plant.name === project.plant);
  }

  return false;
};

export const filterProjectsByPlantAccess = (
  projects: Project[],
  user: Pick<User, 'plant' | 'plantIds'>,
  plants: Plant[],
): Project[] => projects.filter((project) => canAccessProjectPlant(user, plants, project));

export const filterUsersByPlantAccess = (
  users: UserProfile[],
  plantId: string,
): UserProfile[] => users.filter((candidate) => candidate.status === 'Active' && candidate.plantIds.includes(plantId));

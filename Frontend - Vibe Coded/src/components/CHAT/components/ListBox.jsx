import React, { useEffect, useRef, useState,useLayoutEffect,useCallback } from "react";
import { CHAT_CONTACTS_API } from "../api/api";
import apiClient from "../api/auth";
import {
  setCollaborationsData,
  setGroups,
  setMembers,
} from "../store/slices/mainslice";
import { useDispatch, useSelector } from "react-redux";
import { backendUrl } from "../configs/config"; 

const FilterDepartment = ({ selectedPlant, setSelectedPlant ,groups,checkedDepartments,setCheckedDepartments}) => {
  const modalRef = useRef();
  const listRef = useRef(); // scroll container
  const scrollTopRef = useRef(0); // store scroll position

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!modalRef.current.contains(event.target)) {
        setFilterByDepartmentModal(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Save scroll before state changes
  const saveScroll = () => {
    if (listRef.current) scrollTopRef.current = listRef.current.scrollTop;
  };

  // Restore scroll after DOM updates
  const restoreScroll = () => {
    requestAnimationFrame(() => {
      if (listRef.current) listRef.current.scrollTop = scrollTopRef.current;
    });
  };

  function onClickClearAll() {
    saveScroll();
    const filtered = groups
      .filter((g) => g.plant_code === selectedPlant)
      .map((g) => g._id.toString());
    setCheckedDepartments((prev) => prev.filter((id) => !filtered.includes(id)));
    restoreScroll();
  }

  function onClickSelectAll() {
    saveScroll();
    const filtered = groups
      .filter((g) => g.plant_code === selectedPlant)
      .map((g) => g._id.toString());
    setCheckedDepartments((prev) => {
      const unique = new Set([...prev, ...filtered]);
      return [...unique];
    });
    restoreScroll();
  }

  const toggleDepartment = (id, checked) => {
    saveScroll();
    if (checked) {
      setCheckedDepartments((prev) => [...prev, id]);
    } else {
      setCheckedDepartments((prev) => prev.filter((d) => d !== id));
    }
    restoreScroll();
  };

  const uniquePlants = [...new Set(groups.map((g) => g.plant_code))];

  return (
    <div
      ref={modalRef}
      className="p-2 w-[350px] h-[300px] shadow-lg bg-white rounded border flex"
    >
      {/* LEFT: Plant List */}
      <div className="w-[40%] border-r pr-2">
        <h3 className="font-semibold text-sm mb-2">Plants</h3>
        {uniquePlants.map((plant) => (
          <div
            key={plant}
            className={`cursor-pointer p-1 rounded ${
              selectedPlant === plant
                ? "bg-black text-white"
                : "hover:bg-gray-100"
            }`}
            onClick={() => setSelectedPlant(plant)}
          >
            {plant}
          </div>
        ))}
      </div>

      {/* RIGHT: Department List */}
      <div
        ref={listRef}
        className="flex-1 pl-2 overflow-y-scroll"
      >
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <div>Departments</div>
          <div className="flex gap-2 text-[10px] text-gray-700">
            <div className="underline cursor-pointer" onClick={onClickClearAll}>
              Clear All
            </div>
            <div className="underline cursor-pointer" onClick={onClickSelectAll}>
              Select All
            </div>
          </div>
        </div>

        {groups
          .filter((group) => group.plant_code === selectedPlant)
          .map((group) => (
            <div
              key={group._id}
              className="text-xs w-full hover:bg-gray-100 transition-all duration-500 p-1 py-1.5 flex justify-between"
            >
              <div className="w-[80%] truncate overflow-hidden text-gray-500 font-semibold">
                {group.department_name}
                <div className="text-gray-400 text-xs mt-0.5">{group.ID}</div>
              </div>
              <input
                type="checkbox"
                checked={checkedDepartments.includes(group._id.toString())}
                onChange={(e) =>
                  toggleDepartment(group._id.toString(), e.target.checked)
                }
              />
            </div>
          ))}
      </div>
    </div>
  );
};

export default function ListBox({ setSelectedChat, setShowChatArea }) {
  const groups = useSelector(
    (state) => state.mainSliceReducer.collaborationData.groups
  );
  const members = useSelector(
    (state) => state.mainSliceReducer.collaborationData.members
  );
  const [totalUnreadMessages, setTotalUnreadMessages] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedChat, setSelectedChat] = useState("");
  const navigate = useNavigate();
  const userData = { _id: 'dummy-user' }; // Dummy user
  const dispatch = useDispatch();
  const [checkedDepartments, setCheckedDepartments] = useState([]);
  const [filterByDepartmentModal, setFilterByDepartmentModal] = useState(false);
  const [membersData, setmembersData] = useState([]);
    const [showProfile, setShowProfile] = useState(null);
      const [groupsData, setGroupsData] = useState([]);

  useEffect(() => {
    getChatsContacts();

    console.log(members,"members");
    
    
  }, []);

  useEffect(() => {
    let totalUnread = 0;

    for (const group of groups) {
      totalUnread += parseInt(group.unreadmessages);
    }

    for (const member of members) {
      totalUnread += parseInt(member.unreadmessages);
    }

    setTotalUnreadMessages(totalUnread);

    let arr = groups.map((val) => {
      return val._id;
    });
  }, [groups, members]);



useEffect(() => {
  let arr = groups.filter((group) => {
    console.log(group, "==============");

    console.log(checkedDepartments ,"==============");
    

    // Always show if department_name is null
    if (!group._id
) return true;

    // Show all if no department filter
    if (checkedDepartments.length === 0) return true;

    // Show if matches checked departments
    return checkedDepartments.includes(group._id);
  });
  setGroupsData(arr);
}, [groups, checkedDepartments]);



  useEffect(() => {
  let arr = members.filter((val) => {
    // Always show if department is null
    if (val.department === null) return true;
    // Show all if no department filter
    if (checkedDepartments.length === 0) return true;
    // Show if matches checked departments or is ADMIN
    return checkedDepartments.includes(val.department) || val?.type === "ADMIN";
  });
  setmembersData(arr);
}, [members, checkedDepartments]);


  // useEffect(() => {
  //   let arr = [...members];

  //   arr = members.filter((val) => {
  //     console.log(val);

  //     return (
  //       checkedDepartments.includes(val.department) || val?.type == "ADMIN"
  //     );
  //   });

  //   console.log("members", members);
    

  //   setmembersData(arr);
  // }, [members, checkedDepartments]);

  function getChatsContacts() {
    apiClient
      .post(CHAT_CONTACTS_API, {
        _id: 'dummy-user', // Dummy user
      })
      .then((resp) => {
        console.log(resp);

        if (resp.data.status) {
          let arr = resp.data.data.groups.map((val) => {
            return val._id;
          });
          setCheckedDepartments(arr);

          dispatch(setGroups(resp.data.data.groups));
          dispatch(setMembers(resp.data.data.members));

          if (resp.data.data.groups.length > 0) {
            setSelectedChat(resp.data.data.groups[0]);
          } else if (resp.data.data.members.length > 0) {
            setSelectedChat(resp.data.data.members[0]);
          }
        }
      })
      .catch((err) => {
        console.log(err);
      });
  }

    const [selectedPlant, setSelectedPlant] = useState(
    groups.length > 0 ? groups[0].plant_code : ""
  );









  return (
    <>
      <div className="flex relative w-full justify-between">
        <div className="flex">
          <span className="text-gray-700">Inbox</span>
          <div className="text-xs p-1 ml-2 rounded bg-red-100 text-red-500">
            {totalUnreadMessages} new
          </div>
        </div>
        <svg
          onClick={() => {
            setFilterByDepartmentModal(!filterByDepartmentModal);
          }}
          xmlns="http://www.w3.org/2000/svg"
          height="24px"
          viewBox="0 -960 960 960"
          width="20px"
          className={`cursor-pointer ${
            checkedDepartments.length > 0 ? "fill-blue-500" : "fill-gray-500"
          }`}
        >
          <path d="M440-160q-17 0-28.5-11.5T400-200v-240L168-736q-15-20-4.5-42t36.5-22h560q26 0 36.5 22t-4.5 42L560-440v240q0 17-11.5 28.5T520-160h-80Zm40-308 198-252H282l198 252Zm0 0Z" />
        </svg>
        {/* <svg onClick={() => { setFilterByDepartmentModal(!filterByDepartmentModal) }} xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" width="20px" className="cursor-pointer fill-gray-700"><path d="M480-160q-33 0-56.5-23.5T400-240q0-33 23.5-56.5T480-320q33 0 56.5 23.5T560-240q0 33-23.5 56.5T480-160Zm0-240q-33 0-56.5-23.5T400-480q0-33 23.5-56.5T480-560q33 0 56.5 23.5T560-480q0 33-23.5 56.5T480-400Zm0-240q-33 0-56.5-23.5T400-720q0-33 23.5-56.5T480-800q33 0 56.5 23.5T560-720q0 33-23.5 56.5T480-640Z" /></svg> */}
       {filterByDepartmentModal && (
  <div className="fixed top-0 left-0 w-screen h-screen z-[999] "
   onClick={() => setFilterByDepartmentModal(false)} >
    <div
      className="absolute top-[150px] left-[250px] bg-white border rounded shadow-lg"
        onClick={(e) => e.stopPropagation()}
    >
      <FilterDepartment
        selectedPlant={selectedPlant}
        setSelectedPlant={setSelectedPlant}
        groups={groups}
        checkedDepartments={checkedDepartments}
        setCheckedDepartments={setCheckedDepartments}

      />
    </div>
  </div>
)}
      </div>

      <div className="w-full mt-4">
        <input
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
          }}
          type="search"
          placeholder="Search"
          className="w-full  p-3 px-4 text-xs rounded-xl outline-red-600"
        />
      </div>

      <div className="mt-4">
        <div className="text-gray-500 text-sm ml-1">
          Groups - {groupsData.length}
        </div>
        <div className="mt-2 max-h-[220px] p-1 overflow-y-scroll scroll-hidden">
          {groupsData.length > 0 &&
            groupsData.map((group) => {
              let isValid =
                String(group.department_name)
                  .toLowerCase()
                  .includes(searchTerm.toLowerCase()) ||
                String(group.ID)
                  .toLowerCase()
                  .includes(searchTerm.toLowerCase());

              if (!isValid) {
                return;
              }

              return (
                <div
                  onClick={() => {
                    setSelectedChat(group);
                    if (window.innerWidth < 768) {
                      setShowChatArea(true); // hide list, show chat area
                    }
                  }}
                  className={`w-full cursor-pointer active:bg-gray-50 mb-2 flex text-xs justify-between rounded-xl bg-white p-2 ${
                    selectedChat?._id == group._id && "border   border-red-300"
                  }`}
                >
                  <div className="flex items-center">
                    {/* <div className="w-[40px] h-[40px] flex items-center border border-red-100 justify-center bg-red-50 rounded-full">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        height="25px"
                        viewBox="0 -960 960 960"
                        width="24px"
                        className="fill-red-300"
                      >
                        <path d="M0-240v-63q0-43 44-70t116-27q13 0 25 .5t23 2.5q-14 21-21 44t-7 48v65H0Zm240 0v-65q0-32 17.5-58.5T307-410q32-20 76.5-30t96.5-10q53 0 97.5 10t76.5 30q32 20 49 46.5t17 58.5v65H240Zm540 0v-65q0-26-6.5-49T754-397q11-2 22.5-2.5t23.5-.5q72 0 116 26.5t44 70.5v63H780Zm-455-80h311q-10-20-55.5-35T480-370q-55 0-100.5 15T325-320ZM160-440q-33 0-56.5-23.5T80-520q0-34 23.5-57t56.5-23q34 0 57 23t23 57q0 33-23 56.5T160-440Zm640 0q-33 0-56.5-23.5T720-520q0-34 23.5-57t56.5-23q34 0 57 23t23 57q0 33-23 56.5T800-440Zm-320-40q-50 0-85-35t-35-85q0-51 35-85.5t85-34.5q51 0 85.5 34.5T600-600q0 50-34.5 85T480-480Zm0-80q17 0 28.5-11.5T520-600q0-17-11.5-28.5T480-640q-17 0-28.5 11.5T440-600q0 17 11.5 28.5T480-560Zm1 240Zm-1-280Z" />
                      </svg>
                    </div> */}
                         <div className="w-[40px] h-[40px]  flex items-center border border-red-100 justify-center bg-red-50 rounded-full ">
                      <img
                        src={group.image ? `${backendUrl}/${group.image}`: "/default-avatar.png"}
                        alt="Profile"
                        className="w-full h-full object-cover rounded-full"
                      />
                    </div>
                    <div className="p-1 ml-2">
                      <div className="font-semibold  text-gray-800">
                        {group.department_name} - {group.plant_code}
                      </div>
                      <div className="text-xs text-gray-500">{group.ID}</div>
                    </div>
                  </div>
                  <div className="p-1 flex flex-col justify-center items-center">
                    {/* <div className="text-xs">11:35</div> */}
                    {group.unreadmessages != 0 && (
                      <div className="w-[20px] h-[20px] bg-red-600 text-xs flex justify-center items-center rounded-full text-center text-white ">
                        {group.unreadmessages}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      <div className="mt-6">
        <div className="text-gray-500 text-sm ml-1">
          Members - {membersData.length}
        </div>
        <div className="mt-2 p-1">
          {membersData.length > 0 &&
            membersData.map((member) => {
              let isValid =
                String(member.name)
                  .toLowerCase()
                  .includes(searchTerm.toLowerCase()) ||
                String(member.ID)
                  .toLowerCase()
                  .includes(searchTerm.toLowerCase());

              if (!isValid) {
                return;
              }

              return (
                <div
                  onClick={() => {
                    setSelectedChat(member);
                    if (window.innerWidth < 768) {
                      setShowChatArea(true);
                    }
                  }}
                  className={`w-full active:bg-gray-50 mb-2 cursor-pointer flex text-xs justify-between rounded-xl bg-white p-2 ${
                    selectedChat?._id == member._id && "border border-red-300"
                  }`}
                >
                  <div className="flex items-center">
                    <div className="w-[40px] h-[40px]  flex items-center border border-red-100 justify-center bg-red-50 rounded-full "
                      onClick={() =>   setShowProfile(member)}
                    >
                      <img
                        src={member?.profile?.url ? `${backendUrl}/${member?.profile?.url}`: "/default-avatar.png"}
                        alt="Profile"
                        className="w-full h-full object-cover rounded-full"
                      />
                      {/* <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" className="h-full w-full fill-red-300"><path d="M234-276q51-39 114-61.5T480-360q69 0 132 22.5T726-276q35-41 54.5-93T800-480q0-133-93.5-226.5T480-800q-133 0-226.5 93.5T160-480q0 59 19.5 111t54.5 93Zm246-164q-59 0-99.5-40.5T340-580q0-59 40.5-99.5T480-720q59 0 99.5 40.5T620-580q0 59-40.5 99.5T480-440Zm0 360q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q53 0 100-15.5t86-44.5q-39-29-86-44.5T480-280q-53 0-100 15.5T294-220q39 29 86 44.5T480-160Zm0-360q26 0 43-17t17-43q0-26-17-43t-43-17q-26 0-43 17t-17 43q0 26 17 43t43 17Zm0-60Zm0 360Z" /></svg> */}
                    </div>
                    <div className="p-1 ml-2">
                      <div className="font-semibold text-gray-800">
                        {member.name}
                        {member._id == userData._id && " (YOU)"}{" "}
                      </div>
                      <div className="text-xs text-gray-500">{member.ID}</div>
                    </div>
                  </div>
                  <div className="p-1 flex flex-col justify-between items-center">
                    {/* <div className="text-xs">11:35</div> */}
                    {member.unreadmessages != 0 && (
                      <div className="w-[20px] h-[20px] bg-red-600 text-xs flex justify-center items-center rounded-full text-center text-white ">
                        {member.unreadmessages}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
        </div>

        {showProfile && (
          <div
            onClick={() => setShowProfile(null)}
            className="fixed inset-0  flex justify-center items-center top-[-300px] z-50"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-lg p-5 w-[90%] max-w-[400px] relative"
            >
              <button
                className="absolute top-3 right-3 text-gray-500 hover:text-red-500"
                onClick={() => setShowProfile(null)}
              >
                ✕
              </button>
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 rounded-full overflow-hidden border mb-4">
                  <img
                    src={
                      showProfile?.profile?.url
                        ? `${backendUrl}/${showProfile.profile.url}`
                        : "/default-avatar.png"
                    }
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                </div>
                <h2 className="text-lg font-semibold">{showProfile?.name}</h2>
                <p className="text-gray-500 text-sm">{showProfile?.email}</p>
                <p className="text-gray-400 text-xs">ID: {showProfile?.ID}</p>
                <p className="text-gray-400 text-xs">
                  Department: {showProfile?.department_name || "N/A"}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
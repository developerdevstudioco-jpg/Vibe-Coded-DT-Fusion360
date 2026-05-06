import moment from "moment";
import React, { useEffect, useRef, useState } from "react";
import apiClient from "../api/auth";
import { CHAT_API, CHAT_MESSAGE_BY_DATE_USER_ID_API } from "../api/api";
import { useToast } from "../reusable/Toast/Toast";
import { useDispatch, useSelector } from "react-redux";
import { userData, getSocket } from "../socket";
import { setGroups, setMembers } from "../store/slices/mainslice";
import { downloadFile, uploadFile } from "../configs/awsconfig";

import { backendUrl } from "../configs/config";

export default function ChatArea({ propData }) {
  const chatData = propData || { _id: "group1", name: "Group Chat", type: "group", groupMembers: [] };
  const showToast = useToast();

  const Main = () => {
    const groups = useSelector(
      (state) => state.mainSliceReducer.collaborationData.groups
    );
    const members = useSelector(
      (state) => state.mainSliceReducer.collaborationData.members
    );

    const defaultChatObject = {
      message: "",
      attachments: [],
      chat_by_id: 'dummy-user', // Dummy user
      chat_to_id: chatData._id,
      created_date: "",
      created_time: "",
    };

    const [chat, setChat] = useState(defaultChatObject);
    const [chats, setChats] = useState([]);
    const [flag, setFlag] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(1);
    const messagesDiv = useRef();
    const [loader, setLoader] = useState(false);
    const [scrollDown, setScrollDown] = useState(false);
    const [scrollUpLoader, setScrollUpLoader] = useState(false);
    const notificationPushed = useSelector(
      (state) => state.mainSliceReducer.notification
    );
    const dispatch = useDispatch();
    const attachmentRef = useRef();
    const [files, setFiles] = useState([]);
    const [showProfile, setShowProfile] = useState(null);

    useEffect(() => {
      console.log("chatData", chatData);

      if (chatData) {
        if (chatData.type == "group") {
          let arr = groups.map((val) => {
            let obj = { ...val };
            if (val._id == chatData._id) {
              obj.unreadmessages = 0;
            }
            return obj;
          });

          dispatch(setGroups(arr));
        } else {
          let arr = members.map((val) => {
            let obj = { ...val };
            if (val._id == chatData._id) {
              obj.unreadmessages = 0;
            }
            return obj;
          });

          dispatch(setMembers(arr));
        }
      }

      if (hasMore) {
        getChats(chatData?._id, page);
      }
    }, []);

    useEffect(() => {
      messagesDiv.current.scrollTo({
        top: messagesDiv.current.scrollHeight,
        behavior: "smooth",
      });
    }, [scrollDown]);

    useEffect(() => {
      const socket = getSocket();
      if (!socket) return;

      const handleNewMessage = (newMsg) => {
        // append only messages relevant to current chat
        if (!newMsg) return;

        const isGroup = chatData?.type === "group";
        const belongsToChat = isGroup
          ? newMsg.chat_to_id === chatData._id
          : (newMsg.chat_to_id === chatData._id && newMsg.chat_by_id === userData._id) ||
            (newMsg.chat_by_id === chatData._id && newMsg.chat_to_id === userData._id);

        if (belongsToChat) {
          setChats((prev) => [...prev, newMsg]);
          setScrollDown((prev) => !prev);
        }
      };

      socket.on("new-message", handleNewMessage);
      return () => {
        socket.off("new-message", handleNewMessage);
      };
    }, [chatData]);

    useEffect(() => {
      if (notificationPushed.open) {
        let data = { ...notificationPushed?.additional };

        if (
          data &&
          data?.category == "CHAT" &&
          data.chat_by_id != userData._id
        ) {
          let isValid = false;

          if (chatData.type == "group") {
            if (chatData._id.toString() != data.chat_to_id.toString()) {
              return;
            }

            let members_id = chatData.groupMembers.map((val) => {
              return String(val._id).toString();
            });
            isValid = members_id.includes(String(data.chat_by_id).toString());

            chatData.groupMembers.forEach((val) => {
              if (val._id.toString() == data.chat_by_id) {
                data.chat_by = { ...val };
                return;
              }
            });
          } else {
            isValid = data?.chat_by_id == chatData._id;
          }

          if (isValid) {
            setChats([...chats, { ...data }]);
            setScrollDown(!scrollDown);
            console.log("pushedddd");
          }
        }
      }
    }, [notificationPushed]);

    async function sendMessage() {
      try {
        if (files.length > 0) {
          let attachments = [];

          for (const file of files) {
            const responseUpload = await uploadFile(file);
            console.log(responseUpload);

            const fileName = String(file.name).replace(" ", "");

            attachments.push({ url: `path/${fileName}`, file_name: file.name });
          }

          chat.attachments = attachments;
        }

        if (!chat.message && chat.attachments.length == 0) {
          return;
        }

        chat["created_date"] = moment().format("YYYY-MM-DD");
        chat["created_time"] = moment().format("HH:mm:ss.SSS");
        chat["chat_to_id"] = chatData._id;

        apiClient
          .post(CHAT_API, chat)
          .then((resp) => {
            console.log("chat res", resp);

            if (resp.data.status) {
              setChat(defaultChatObject);
              setChats([...chats, resp.data.data]);
              setFiles([]);
              setScrollDown(!scrollDown);

              const socket = getSocket();
              socket?.emit("send-message", resp.data.data);
            }
          })
          .catch((err) => {
            //console.log(err);
          });
      } catch (err) {
        console.log(err);
      }
    }

    function getChats(to_id, page) {
      setLoader(true);

      let data = {
        chat_by_id: 'dummy-user', // Dummy user
        chat_to_id: to_id,
        group: false,
        page: page,
        limit: 10,
      };

      if (chatData.type == "group") {
        data["group"] = true;
      }

      apiClient
        .post(CHAT_MESSAGE_BY_DATE_USER_ID_API, data)
        .then((resp) => {
          console.log(resp);
          setHasMore(resp.data.hasMore);

          if (resp.data.status) {
            setChats(resp.data.data);
            setScrollDown(!scrollDown);
          }
        })
        .catch((err) => {
          //console.log(err);
        })
        .finally(() => {
          setLoader(false);
        });
    }

    function getChatsOnScroll(to_id, page) {
      setScrollUpLoader(true);

      let data = {
        chat_by_id: 'dummy-user', // Dummy user
        chat_to_id: to_id,
        group: false,
        page: page,
        limit: 10,
        main: true,
      };

      if (chatData.type == "group") {
        data["group"] = true;
      }

      apiClient
        .post(CHAT_MESSAGE_BY_DATE_USER_ID_API, data)
        .then((resp) => {
          //console.log(resp);
          setHasMore(resp.data.hasMore);

          if (resp.data.status) {
            setChats([...resp.data.data, ...chats]);

            const scrollTopBefore = messagesDiv.current.scrollTop;
            const scrollHeightBefore = messagesDiv.current.scrollHeight;

            // Adjust the scroll position to stay at the same place
            setTimeout(() => {
              const scrollHeightAfter = messagesDiv.current.scrollHeight;
              messagesDiv.current.scrollTop =
                scrollTopBefore + (scrollHeightAfter - scrollHeightBefore);
            }, 0); // Wait for DOM update
          }
        })
        .catch((err) => {
          //console.log(err);
        })
        .finally(() => {
          setScrollUpLoader(false);
        });
    }

    function convertTo12HourFormat(time24) {
      //console.log(time24);

      const [hours, minutes] = time24.split(":").map(Number);
      const amPm = hours < 12 ? "AM" : "PM";
      const convertedHours = hours % 12 === 0 ? 12 : hours % 12;

      return `${convertedHours}:${minutes.toString().padStart(2, "0")} ${amPm}`;
    }

    const handleScroll = (e) => {
      const { scrollTop, scrollHeight, clientHeight } = e.target;
      //console.log(scrollTop);

      if (scrollTop == 0 && hasMore) {
        if (hasMore) {
          setPage(page + 1);
          getChatsOnScroll(chatData._id, page + 1);
        }
      }
    };

    function onClickTrash(index) {
      let arr = files.filter((val, i) => {
        return i != index;
      });

      setFiles(arr);
    }

    return (
      <div className="w-full h-full relative shadow min-h-[500px] rounded-xl overflow-hidden  bg-white">
        <div className="w-full relative h-[10%] border-b flex justify-center items-center p-2">
          <div className="absolute left-0 ">
            {window.innerWidth < 768 && (
              <button
                onClick={() => setShowChatArea(false)}
                className=" ml-4 py-1 text-sm text-black"
              >
                ← Back
              </button>
            )}
          </div>

          <div>
            <div className="text-gray-800 text-center text-sm">
              {chatData?.type == "group"
                ? `${chatData.department_name} - ${chatData.ID}`
                : `${chatData.name} - ${chatData.ID ? chatData.ID : "NONE"}`}
            </div>
            {/* <div className="text-gray-500 text-xs text-center">last seen 45 minutes ago</div> */}
          </div>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="24px"
            viewBox="0 -960 960 960"
            width="24px"
            fill="#999999"
            className="absolute right-2 top-4"
          >
            <path d="M240-400q-33 0-56.5-23.5T160-480q0-33 23.5-56.5T240-560q33 0 56.5 23.5T320-480q0 33-23.5 56.5T240-400Zm240 0q-33 0-56.5-23.5T400-480q0-33 23.5-56.5T480-560q33 0 56.5 23.5T560-480q0 33-23.5 56.5T480-400Zm240 0q-33 0-56.5-23.5T640-480q0-33 23.5-56.5T720-560q33 0 56.5 23.5T800-480q0 33-23.5 56.5T720-400Z" />
          </svg>
        </div>

        <div
          ref={messagesDiv}
          onScroll={handleScroll}
          className=" w-full h-[80%] pb-2 overflow-y-scroll scroll-hidden"
        >
          {chats.length > 0 ? (
            chats.map((chat, index) => {
              let chatByMe =
                chat.chat_by_id ==
                'dummy-user'; // Dummy user
              let isDateDifferent =
                index == 0
                  ? true
                  : chat.created_date != chats[index - 1].created_date;

              let showDate = isDateDifferent;

              let isOnlyAttachmentSent =
                !chat.message && chat.attachments.length;

              console.log(chatByMe);

              return (
                <div>
                  {showDate && (
                    <div className="w-full flex items-center justify-center text-gray-400 text-center text-[12px] p-4">
                      {scrollUpLoader ? (
                        <div className="loaderBar"></div>
                      ) : (
                        <div className="">{moment(chat.created_date).format("DD-MM-YYYY")} </div>
                      )}
                    </div>
                  )}

                  {chat.attachments.length > 0 && (
                    <div
                      className={`w-full flex items-end  px-2 ${
                        chatByMe ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div className=" flex flex-col gap-2 mb-2 mt-4">
                        {chat.attachments.length > 0 &&
                          chat.attachments.map((val) => {
                            return (
                              <div className="flex gap-2">
                                {!chatByMe && (
                                  <div className="w-[25px] h-[25px] rounded-full  flex items-center justify-center">
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      viewBox="0 -960 960 960"
                                      className="fill-red-300"
                                    >
                                      <path d="M234-276q51-39 114-61.5T480-360q69 0 132 22.5T726-276q35-41 54.5-93T800-480q0-133-93.5-226.5T480-800q-133 0-226.5 93.5T160-480q0 59 19.5 111t54.5 93Zm246-164q-59 0-99.5-40.5T340-580q0-59 40.5-99.5T480-720q59 0 99.5 40.5T620-580q0 59-40.5 99.5T480-440Zm0 360q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Z" />
                                    </svg>
                                  </div>
                                )}

                                <div className="p-1.5 pb-1 bg-gray-100 border rounded-lg">
                                  <div className="w-[200px]">
                                    <div className="w-full flex gap-2 text-gray-500 items-center justify-between">
                                      <div className="w-[80%] flex items-center gap-1">
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          viewBox="0 -960 960 960"
                                          width="12%"
                                          fill="#999999"
                                        >
                                          <path d="M320-240h320v-80H320v80Zm0-160h320v-80H320v80ZM240-80q-33 0-56.5-23.5T160-160v-640q0-33 23.5-56.5T240-880h320l240 240v480q0 33-23.5 56.5T720-80H240Zm280-520v-200H240v640h480v-440H520ZM240-800v200-200 640-640Z" />
                                        </svg>
                                        <div className="w-[83%] truncate text-sm">
                                          {val.file_name}
                                        </div>
                                      </div>

                                      <svg
                                        onClick={() => {
                                          downloadFile(val.file_name);
                                        }}
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 -960 960 960"
                                        width="13%"
                                        className="fill-gray-400 cursor-pointer transition-all delay-100 hover:fill-gray-500"
                                      >
                                        <path d="M439-82q-76-8-141.5-42.5t-113.5-88Q136-266 108.5-335T81-481q0-155 102.5-268.5T440-880v80q-121 17-200 107.5T161-481q0 121 79 211.5T439-162v80Zm40-198L278-482l57-57 104 104v-245h80v245l103-103 57 58-200 200Zm40 198v-80q43-6 82.5-23t73.5-43l58 58q-47 37-101 59.5T519-82Zm158-652q-35-26-74.5-43T520-800v-80q59 6 113 28.5T733-792l-56 58Zm112 506-56-57q26-34 42-73.5t22-82.5h82q-8 59-30 113.5T789-228Zm8-293q-6-43-22-82.5T733-677l56-57q38 45 61 99.5T879-521h-82Z" />
                                      </svg>
                                    </div>

                                    <div className="w-full text-[11px] text-gray-400 flex items-end justify-end mt-1">
                                      <div>
                                        {convertTo12HourFormat(
                                          chat.created_time
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}

                  {chatByMe ? (
                    <div className="chatPopIn w-full px-2 mb-2 flex justify-end">
                      <div
                        style={{ display: chat.message ? "flex" : "none" }}
                        className="flex"
                      >
                        <div className="ml-2 p-2 rounded-b-lg flex rounded-l-lg bg-red-500">
                          <div>
                            <div className="text-sm text-white">
                              {/* {chat.message} */}
                              {/^https?:\/\/\S+$/.test(chat.message) ? (
                                <a
                                  href={chat.message}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-400 underline hover:text-blue-300"
                                >
                                  {chat.message}
                                </a>
                              ) : (
                                chat.message
                              )}
                            </div>
                          </div>
                          <div className="ml-4 mt-2 h-full text-[10px] p-1 text-gray-100 flex items-end justify-end">
                            {convertTo12HourFormat(chat.created_time)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{ display: chat.message ? "flex" : "none" }}
                      className="w-full px-2 mb-2"
                    >
                      <div className="flex">
                        {/* <div className="w-[25px] h-[25px] rounded-full  flex items-center justify-center">
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" className="fill-red-300"><path d="M234-276q51-39 114-61.5T480-360q69 0 132 22.5T726-276q35-41 54.5-93T800-480q0-133-93.5-226.5T480-800q-133 0-226.5 93.5T160-480q0 59 19.5 111t54.5 93Zm246-164q-59 0-99.5-40.5T340-580q0-59 40.5-99.5T480-720q59 0 99.5 40.5T620-580q0 59-40.5 99.5T480-440Zm0 360q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q53 0 100-15.5t86-44.5q-39-29-86-44.5T480-280q-53 0-100 15.5T294-220q39 29 86 44.5T480-160Zm0-360q26 0 43-17t17-43q0-26-17-43t-43-17q-26 0-43 17t-17 43q0 26 17 43t43 17Zm0-60Zm0 360Z" /></svg>
                                                    </div> */}
                        <div
                          onClick={() => setShowProfile(chat.chat_by)}
                          className="w-[30px] h-[30px] rounded-full overflow-hidden cursor-pointer border border-gray-300"
                        >
                          <img
                            src={
                              chatData?.type === "group"
                                ? chat?.chat_by?.profile?.url
                                  ? `${backendUrl}/${chat.chat_by.profile.url}`
                                  : "/default-avatar.png"
                                : chatData?.profile?.url
                                ? `${backendUrl}/${chatData.profile.url}`
                                : "/default-avatar.png"
                            }
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="ml-2 p-2 rounded-b-lg flex rounded-r-lg bg-gray-100">
                          <div>
                            <div className="text-[10px] font-semibold text-gray-500">
                              {chat?.chat_by?.name}{" "}
                            </div>
                            <div className="text-sm text-gray-700">
                              {/^https?:\/\/\S+$/.test(chat.message) ? (
                                <a
                                  href={chat.message}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-400 underline hover:text-blue-300"
                                >
                                  {chat.message}
                                </a>
                              ) : (
                                chat.message
                              )}
                            </div>
                          </div>
                          <div className="ml-4 mt-2 h-full text-[10px] p-1 text-gray-400 flex items-end justify-end">
                            {convertTo12HourFormat(chat.created_time)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="w-full text-gray-500 flex items-center justify-center h-full">
              No Conversations Yet!
            </div>
          )}

          {loader && (
            <div className="w-full h-full absolute left-0 top-0 bottom-0 flex items-center justify-center  text-gray-500 bg-white/20 backdrop-blur">
              <div className="loader" />
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="w-full z-100 relative h-[10%] border-t flex p-1"
        >
          {files.length > 0 && (
            <div className="absolute bg-white border-t border-gray-200 w-full h-[150px] p-3 z-1  left-0 rounded-t-lg  p-1  top-[-150px] flex gap-5">
              <div className="text-gray-500 mb-3 text-sm gap-0.5 font-semibold flex ">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="18px"
                  viewBox="0 -960 960 960"
                  fill="#999999"
                >
                  <path d="M320-240h320v-80H320v80Zm0-160h320v-80H320v80ZM240-80q-33 0-56.5-23.5T160-160v-640q0-33 23.5-56.5T240-880h320l240 240v480q0 33-23.5 56.5T720-80H240Zm280-520v-200H240v640h480v-440H520ZM240-800v200-200 640-640Z" />
                </svg>
                <p className="">{files.length}</p>
              </div>
              <div className="w-[95%] flex gap-2 items-start justify-start flex-wrap justify-items-start overflow-y-scroll h-fit max-h-full">
                {files.length > 0 &&
                  files.map((file, index) => {
                    return (
                      <div className="flex p-2 h-fit w-fit text-xs rounded-lg border items-center text-gray-600 gap-2 bg-gray-100 w-fit">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          height="24px"
                          viewBox="0 -960 960 960"
                          width="24px"
                          fill="#999999"
                        >
                          <path d="M320-240h320v-80H320v80Zm0-160h320v-80H320v80ZM240-80q-33 0-56.5-23.5T160-160v-640q0-33 23.5-56.5T240-880h320l240 240v480q0 33-23.5 56.5T720-80H240Zm280-520v-200H240v640h480v-440H520ZM240-800v200-200 640-640Z" />
                        </svg>
                        <p className="max-w-[100px] overflow-hidden ellipsis">
                          {file.name}
                        </p>
                        <svg
                          onClick={() => onClickTrash(index)}
                          xmlns="http://www.w3.org/2000/svg"
                          height="18px"
                          viewBox="0 -960 960 960"
                          width="24px"
                          fill="#EA3323"
                          className="ml-2"
                        >
                          <path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z" />
                        </svg>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          <input
            disabled={chatData?.type == "ADMIN" && chats.length == 0}
            value={chat.message}
            onChange={(e) => {
              setChat({ ...chat, message: e.target.value });
            }}
            type="text"
            className="w-[90%] p-3 outline-none text-sm rounded-xl focus:border focus:border-gray-300  bg-gray-100"
            placeholder="Start Typing..."
          />
          <div className="w-[10%] flex p-1 items-center justify-evenly">
            <div>
              <input
                type="file"
                disabled={chatData?.type == "ADMIN" && chats.length == 0}
                multiple
                ref={attachmentRef}
                className="hidden"
                onChange={(e) => {
                  try {
                    let tempFiles = Array.from(e.target.files); // Convert FileList to an array

                    for (let file of tempFiles) {
                      validateFileType(file);
                    }

                    setFiles(tempFiles);
                  } catch (err) {
                    setFiles([]);
                    showToast(err.message, "error");
                  }
                }}
              />

              <svg
                onClick={() => {
                  attachmentRef.current.click();
                }}
                xmlns="http://www.w3.org/2000/svg"
                height="24px"
                viewBox="0 -960 960 960"
                width="24px"
                fill="#999999"
                className="cursor-pointer hover:fill-red-500 active:fill-red-300"
              >
                <path d="M720-330q0 104-73 177T470-80q-104 0-177-73t-73-177v-370q0-75 52.5-127.5T400-880q75 0 127.5 52.5T580-700v350q0 46-32 78t-78 32q-46 0-78-32t-32-78v-370h80v370q0 13 8.5 21.5T470-320q13 0 21.5-8.5T500-350v-350q-1-42-29.5-71T400-800q-42 0-71 29t-29 71v370q-1 71 49 120.5T470-160q70 0 119-49.5T640-330v-390h80v390Z" />
              </svg>
            </div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              onClick={() => {
                sendMessage();
              }}
              height="24px"
              viewBox="0 -960 960 960"
              width="24px"
              fill="#999999"
              className="cursor-pointer hover:fill-red-500 active:fill-red-300"
            >
              <path d="M120-160v-640l760 320-760 320Zm80-120 474-200-474-200v140l240 60-240 60v140Zm0 0v-400 400Z" />
            </svg>
          </div>
        </form>

        {/* {showProfile && (
  <div
    onClick={() => setShowProfile(false)}
    className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
  >
    <div
      onClick={(e) => e.stopPropagation()}
      className="bg-white rounded-xl shadow-lg p-5 w-[90%] max-w-[400px] relative"
    >
      <button
        className="absolute top-3 right-3 text-gray-500 hover:text-red-500"
        onClick={() => setShowProfile(false)}
      >
        ✕
      </button>
      <div className="flex flex-col items-center">
        <div className="w-24 h-24 rounded-full overflow-hidden border mb-4">
          <img
            src={chatData?.profile?.url ?`${backendUrl}/${chatData?.profile?.url}` : "/default-avatar.png"}
            alt="Profile"
            className="w-full h-full object-cover"
          />
        </div>
        <h2 className="text-lg font-semibold">{chatData?.name}</h2>
        <p className="text-gray-500 text-sm">{chatData?.email}</p>
        <p className="text-gray-400 text-xs">ID: {chatData?.ID}</p>
        <p className="text-gray-400 text-xs">
          Department: {chatData?.department_name || "N/A"}
        </p>
      </div>
    </div>
  </div>
)} */}

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
    );
  };

  return chatData ? <Main /> : <></>;
}

const validateFileType = (file) => {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  if (!file) {
    throw new Error("No file provided");
  }

  if (!allowedTypes.includes(file.type)) {
    throw new Error(
      "Invalid file type. Please upload an image, PDF, XLSX, or DOCX file."
    );
  }

  console.log("File is valid");
};
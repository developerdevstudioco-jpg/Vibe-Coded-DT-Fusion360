import { io } from 'socket.io-client';
import { backendUrl,socketUrl  } from '../configs/config';
import { store } from '../store/store';
import { resetNotification, setGroups, setMembers, setNotification, setNotifications } from '../store/slices/mainslice';
// import apiClient from "../api/auth"
// import { NOTIFICATIONS_BY_USER_ID } from "../api/api"

let socketClient = null;
// export const userData = JSON.parse(localStorage.getItem("tsk-user"))
export const userData = { _id: 'dummy-user' } // Dummy user for testing

export function initializeSocket() {

  // const userData = JSON.parse(localStorage.getItem("tsk-user"));
  const userData = { _id: 'dummy-user' }; // Dummy user

  socketClient = io(socketUrl, {
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
  });

  socketClient.on("connect", () => {
    console.log("SOCKET CONNECTED:", socketClient.id);

    // const user = JSON.parse(localStorage.getItem("tsk-user"));
    const user = { _id: 'dummy-user' }; // Dummy user
    if (user?._id) {
      console.log("REGISTERING USER:", user._id);
      socketClient.emit("register", user._id);
      socketClient.emit("user-online", user._id);
    }
  });

    window.addEventListener("beforeunload", () => {
    // const user = JSON.parse(localStorage.getItem("tsk-user"));
    const user = { _id: 'dummy-user' }; // Dummy user
    if (user?._id) {
      console.log("Sending USER-OFFLINE before unload");
      socketClient.emit("user-offline", user._id);
    }
  });

  // Heartbeat every 20s
  setInterval(() => {
    // const user = JSON.parse(localStorage.getItem("tsk-user"));
    const user = { _id: 'dummy-user' }; // Dummy user
    if (user?._id) {
      socketClient.emit("user-online", user._id);
    }
  }, 20000);
}

function updateChatUnReadMessagesStatus(chatData) {

    const storeData = store.getState();

    const groups = storeData.mainSliceReducer.collaborationData.groups;
    const members = storeData.mainSliceReducer.collaborationData.members;

    if (chatData && chatData?.category == 'CHAT') {

        let groupsId = groups.map((val) => String(val._id).toString())
        let isGroupChat = groupsId.includes(String(chatData.chat_to_id).toString());

        if (isGroupChat) {
            let arr = groups.map((val) => {
                let group = { ...val };

                if (val._id.toString() == chatData.chat_to_id.toString()) {
                    group.unreadmessages += 1;
                }

                return group
            })
            store.dispatch(setGroups(arr))
        }
        else {

            let arr = members.map((val) => {
                let member = { ...val };

                if (val._id.toString() == chatData.chat_by_id.toString()) {
                    member.unreadmessages += 1;
                }

                return member
            })
            store.dispatch(setMembers(arr))

        }


    }

}

// function getNotifications() {

//     apiClient.get(NOTIFICATIONS_BY_USER_ID + "/" + JSON.parse(localStorage.getItem("tsk-user"))._id)
//         .then((resp) => {

//             if (resp.data.status) {
//                 store.dispatch(setNotifications({ open: false, data: resp.data.data }))
//             }
//         })
//         .catch((err) => {
//             console.log(err);

//         })

// }

export function getSocket() {
  return socketClient;
}
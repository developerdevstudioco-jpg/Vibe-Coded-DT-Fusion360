import React, { useEffect, useState } from "react";
import { Provider } from "react-redux";
import { store } from "./CHAT/store/store";
import { initializeSocket } from "./CHAT/socket";
import ListBox from "./CHAT/components/ListBox";
import ChatArea from "./CHAT/components/ChatArea";

export default function Chat() {
  const [showChatArea, setShowChatArea] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);

  useEffect(() => {
    initializeSocket();
  }, []);

  return (
    <Provider store={store}>
      <div className="p-2 h-screen">
        <div className="w-full flex items-baseline p-2">
          <div className="text-2xl text-gray-700 font-bold">Messages</div>
        </div>

        <div className="w-full flex h-[80%]">
          <div
            className={`w-full min-h-[calc(100vh-8rem)] md:w-[25%] bg-gray-100 min-w-[300px] p-2 rounded-xl overflow-y-scroll scroll-hidden ${
              showChatArea && window.innerWidth < 768 ? "hidden" : "block"
            } md:block`}
          >
            <ListBox setShowChatArea={setShowChatArea} setSelectedChat={setSelectedChat} />
          </div>

          <div
            className={`w-full md:w-[75%] min-h-[calc(100vh-8rem)] ml-0 md:ml-4 min-w-[350px] ${
              !showChatArea && window.innerWidth < 768 ? "hidden" : "block"
            }`}
          >
            {selectedChat ? (
              <ChatArea propData={selectedChat} />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                Select a chat to start messagssing
              </div>
            )}
          </div>
        </div>
      </div>
    </Provider>
  );
}
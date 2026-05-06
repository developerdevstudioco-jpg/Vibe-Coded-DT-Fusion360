import React, { useEffect, useState } from "react";
import Topbar from "../../../staticViews/TopBar/TopBar";
import ChatArea from "./ChatArea";
import apiClient from "../api/auth";
import { CHAT_CONTACTS_API, DEPARTMENT } from "../api/api";
import { Route, Routes, useNavigate } from "react-router-dom";
import { userData } from "../socket";
import ListBox from "./ListBox";

export default function Collaboration() { 
const [showChatArea, setShowChatArea] = useState(false);


    return (
        <div className="p-2 h-screen">
            <Topbar />

            <div className="w-full flex items-baseline p-2 ">
                <div className="text-2xl text-gray-700 font-bold">Messages</div>
            </div>

            <div className="w-full flex h-[80%]">

                <div className={`w-full min-h-[calc(100vh-8rem)] md:w-[25%] bg-gray-100 min-w-[300px] p-2 rounded-xl overflow-y-scroll scroll-hidden   ${showChatArea && window.innerWidth < 768 ? 'hidden' : 'block'} md:block`}>
                    <ListBox setShowChatArea={setShowChatArea}/>
                </div>


                <div className={`w-full md:w-[75%] min-h-[calc(100vh-8rem)] ml-0 md:ml-4 min-w-[350px]
      ${!showChatArea && window.innerWidth < 768 ? 'hidden' : 'block'}`}>
                    <Routes>
                        <Route path="/chat" element={<ChatArea  setShowChatArea={setShowChatArea}/>} />
                    </Routes> 
                </div>


            </div>

        </div>
    )
}
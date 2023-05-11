import React, { useEffect, useState, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSmile, faPaperPlane } from '@fortawesome/free-regular-svg-icons';
import { IoMdSettings } from 'react-icons/io';
import { HiPhoneMissedCall } from 'react-icons/hi';

import empty from '../assets/images/empty.png';
import MyProfile from '../components/MyProfile';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { getUser, setLoginData, setUserData } from '../redux/userSlice';
import { Chat, LogoType } from '../types/chat';
import { getChats, setChatsData, setIsAllowedExpand } from '../redux/chatsSlice';
import ChatHeader from '../components/HomeChat/ChatHeader';
import ConfigDropdown from '../layout/Dropdowns/Config';
import SearchBar from '../components/SearchBar';
import ChatTab from '../components/HomeChat/ChatTab';
import ChatMessages from '../components/HomeChat/ChatMessages';
import {getChatQueries, postMessage} from "../queries/users/chats/chats.queries"
import { getUserQueries } from '../queries/users/users.queries';
import { connect } from 'react-redux';
import PropTypes from "prop-types";
import { io } from "socket.io-client"
import { NotificationFailure, NotificationSuccess } from '../components/Notifications';
function HomeChat({setUserData, setChatsData}) {
  const chatHeaderInitialState: Chat = {
    messages: [],
    messageIdToDisplay: '',
    image: '',
    name: ''
  };

  const socket = io("http://localhost:8080")
 
  const [msgEntry, setMsgEntry] = useState<string>('');
  const [selectedChat, setSelectedChat] = useState<string>('');
  const [userChatData, setUserChatData] = useState(chatHeaderInitialState);
  const [configOpen, setConfigOpen] = useState<Boolean>(false);

  const ref = useRef<any>();
  const chats = useAppSelector(getChats);
  const dispatch = useAppDispatch();
 
  const userData = useAppSelector(getUser);
  const { token , userId} = userData
  
  const positionRef = useRef<any>();

  const logo = empty as unknown as LogoType;

  useEffect(() => {
    //obtener datos de chat y user y guardarlos en el store
   getChatQueries({token,setChatsData})
   getUserQueries({token, setUserData})
  
  }, []);
  
  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
      setConfigOpen((isOpen) => isOpen && chats.isAllowedExpand);
      // Update scroll position
      positionRef.current.scrollIntoView();
      /*
        TODO: 
          1. Listen the socket
          2. Get chat data
          3. Set the socket off and return void to prevent useless renders
      */
      
      //1. Listen the socket && 2. Get chat data
      socket.on("chats", (params: any) => {
        if (params.action === "SentNewMessage") {
          getChatQueries({ token, setChatsData })
            .then(() => NotificationSuccess((`Recibiste un mje de ${params.userId} mensaje: ${msgEntry}`)))
            .catch(()=>  NotificationFailure("Ocurrio un error, intentelo mas tarde"))   
        }
      })      
      // 3. Set the socket off and return void to prevent useless renders
      return () => {
        socket.off("chats",(params) => console.log(params.action) )
      }
    }
  }, [chats]);


  const handleMsgEntry = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMsgEntry(e.target.value);
  };

  const handleSendMsg = () => {
    if (msgEntry !== '') {
      /*
        TODO:
        1. Send message
      */
      postMessage(msgEntry, selectedChat, token)

      socket.emit("chats", {
        action: 'SentNewMessage',
        userId: userId,
        chatId: selectedChat
      })

      setMsgEntry('');
    } else {
      /* TODO: 
        1. Show error notification
      */
      NotificationFailure("Ocurrio un error, intentelo mas tarde")
    }
  };

  const handleChatClick = (chatId: string) => {
    setSelectedChat(chatId);
  };

  const handleEnterPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSendMsg();
  };

  const handleOpenConfig = (e: React.MouseEvent<HTMLDivElement>) => {
    setConfigOpen(!configOpen);
    dispatch(setIsAllowedExpand(true));
    e.stopPropagation();
  };

  const getChatsData = () => {
    /* TODO: 
      Get all chats data 
    */
    
  };
  

  return (
    <div className="main-wrapper-chat d-flex row flex-grow-1 w-85" data-aos="zoom-in">
      <div className="chat-left-side bg-chats-background d-flex flex-column w-30 p-0">
        <div className="profile-container bg-chatter-green px-3 d-flex justify-content-between align-items-center py-2">
          <MyProfile
            name={userData?.name}
            lastName={userData?.lastName}
            email={userData?.email}
            photo={userData?.photo}
          />
          <div className="position-relative cursor-pointer d-flex">
            <span
              className="iconHover fs-3 align-self-center justify-self-center"
              onClick={handleOpenConfig}
            >
              <IoMdSettings aria-label="Boton de Configuracion" />
            </span>
            <ConfigDropdown isOpen={configOpen} setConfigOpen={setConfigOpen} userData={userData} getChatsData={getChatsData} />
          </div>
        </div>
        <SearchBar userId={userData.userId} chatId={selectedChat} />

        <div className="chatsDiv d-flex flex-grow-1 flex-column" ref={ref}>
          <div ref={positionRef} />
          {chats && chats.chats?.length > 0 ? (
            chats.chats.map((tab: any, i: any) => (
              <ChatTab
                key={i}
                name={tab.name}
                image={tab.photo}
                chatId={tab.chatId}
                messages={tab.messages}
                userData={userData}
                selectedChat={selectedChat}
                onClick={() => handleChatClick(tab.chatId)}
              />
            ))
          ) : (
            <div className="text-chatter-black opacity-25 fs-smaller text-center h-100 d-flex justify-content-center align-items-center text-no-selection">
              <div>No hay chats disponibles</div>
            </div>
          )}
        </div>
      </div>

      {selectedChat === '' ? (
        <div className="chat-right-side empty-chats w-70 d-flex flex-column justify-content-center align-items-center align-content-center p-0 position-relative text-no-selection overflow-hidden">
          <img className="opacity-50" src={logo.src} alt="background" />
          <div className="d-flex flex-column align-items-center justify-content-center text-chatter-black opacity-75">
            <div className="fs-3 fw-bold">CHATTER</div>
            <div className="my-1">¡Comunicate con tus amigos sin costo alguno!</div>
            <div className="division-line bg-chatter-black opacity-25 my-3"></div>
            <div className="fs-smaller d-flex justify-content-center align-items-center gap-2">
              <HiPhoneMissedCall />
              Llamadas Deshabilitadas
            </div>
          </div>
          <div className="empty-chat-line" />
        </div>
      ) : (
        <div className="chat-right-side w-70 d-flex flex-column p-0">
          <ChatHeader {...userChatData} />

          <ChatMessages chatId={selectedChat} chatsData={chats} setUserChatData={setUserChatData} />

          <div className="d-flex flex-row align-items-center justify-content-center bg-chatter-green px-4 py-2">
            <div className="black-icon cursor-pointer text-chatter-black fs-3 opacity-75">
              <FontAwesomeIcon icon={faSmile} />
            </div>

            <div className="w-100 px-3">
              <input
                placeholder="Escribe tu mensaje"
                value={msgEntry}
                className="user-chat-input px-4 py-4 w-100 bg-white"
                onChange={handleMsgEntry}
                onKeyDown={handleEnterPress}
                disabled={selectedChat ? false : true}
              />
            </div>

            <div
              className="black-icon text-chatter-black fs-3 opacity-75 cursor-pointer"
              onClick={handleSendMsg}
            >
              <FontAwesomeIcon icon={faPaperPlane} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

HomeChat.propTypes = {
  setUserData: PropTypes.func.isRequired,
  setLoginData: PropTypes.func.isRequired,
};

const mapStateToProps = (dispatch: any) => ({
  setUserData: (state: any) => dispatch(setUserData(state)),
  setChatsData: (state: any) => dispatch(setChatsData(state))
  
})

export default connect(null, mapStateToProps)(HomeChat);

import React, { createContext, useEffect, useState } from "react";
import { nanoid } from "nanoid";

interface IChatBoxContext {
  themeColor?: string;
  textColor?: string;

  autoMessage?: string;
  title?: string;
  description?: string;

  showOnInitial: boolean;

  isModalShow: boolean;
  onModalShow: (state: boolean) => void;

  chat: string[];
  message: string;
  setMessage: (message: string) => void;
  onSendMessage: () => void;
}

const defaultState = {
  showOnInitial: false,
} as IChatBoxContext;

const ChatBoxContext = createContext<IChatBoxContext>(defaultState);

export function ChatBoxProvider({
  themeColor,
  textColor,
  autoMessage,
  title,
  description,
  showOnInitial,
  children,
}: {
  themeColor?: string;
  textColor?: string;
  autoMessage?: string;
  title?: string;
  description?: string;
  showOnInitial: boolean;
  children: any;
}) {
  // default is 24 hours
  function setWithExpiry(
    key: string,
    value: string,
    ttl = 24 * 60 * 60 * 1000
  ) {
    const now = new Date();

    const item = {
      value: value,
      expiry: now.getTime() + ttl,
    };
    localStorage.setItem(key, JSON.stringify(item));
  }

  function getWithExpiry(key: string) {
    const itemStr = localStorage.getItem(key);
    if (!itemStr) {
      return null;
    }
    const item = JSON.parse(itemStr);
    const now = new Date();
    if (now.getTime() > item.expiry) {
      localStorage.removeItem(key);
      window.location.reload();
      return null;
    }
    return item.value;
  }

  let initialID = "visitor";
  const localID = getWithExpiry("chatbox_id");
  console.log("localID", localID);

  const [UID, setUID] = useState(localID ? localID : initialID);
  const [chatInitiated, setChatInitiated] = useState(localID ? true : false);

  const [chat, setChat] = useState([]);
  const [message, setMessage] = useState("");

  const [isModalShow, setIsModalShow] = useState(showOnInitial);

  async function fetchList(id = UID) {
    const response = await fetch(`/api/chatbox/chat/${id}`, { method: "GET" });
    const data = await response.json();
    setChat(data.chatData);
  }

  const onSendMessage = async () => {
    try {
      let id = UID;

      if (!chatInitiated) {
        id = nanoid(10);

        const initResponse = await fetch(`/api/chatbox/slack/${id}`, {
          method: "POST",
        });

        setWithExpiry("chatbox_id", id);

        if (initResponse.status !== 200) {
          localStorage.removeItem("chatbox_id");
          throw new Error("Failed to init chat");
        }

        setChatInitiated(true);
        setUID(id);
      }

      let replyText = "i:" + message;

      const replyResponse = await fetch(`/api/chatbox/chat/${id}`, {
        method: "POST",
        body: JSON.stringify({ text: replyText }),
      });

      if (replyResponse.status !== 200) {
        throw new Error("Failed to reply");
      }

      await fetchList(id);
      return setMessage("");
    } catch (err) {
      alert(err);
    }
  };

  const onModalShow = (status: boolean) => {
    setIsModalShow(status);
  };

  useEffect(() => {
    if (!chatInitiated || !isModalShow) return;

    fetchList();
    const interval = setInterval(() => {
      fetchList();
    }, 3000);

    return () => clearInterval(interval);
  }, [chatInitiated, isModalShow, UID]);

  return (
    <ChatBoxContext.Provider
      value={{
        themeColor,
        textColor,

        autoMessage,
        title,
        description,

        showOnInitial,

        isModalShow,
        onModalShow,

        chat,
        message,
        setMessage,
        onSendMessage,
      }}
    >
      {children}
    </ChatBoxContext.Provider>
  );
}

export default ChatBoxContext;

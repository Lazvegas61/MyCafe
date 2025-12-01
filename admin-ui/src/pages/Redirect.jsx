// src/pages/Redirect.jsx
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Redirect() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }

    if (user.role === "ADMIN") navigate("/admin");
    else if (user.role === "GARSON") navigate("/masalar");
    else if (user.role === "MUTFAK") navigate("/mutfak");
  }, [user]);

  return <div></div>;
}


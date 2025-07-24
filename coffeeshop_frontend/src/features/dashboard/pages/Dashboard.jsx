import React from "react";
import { useUser } from "@/context/UserContext";

export default function Dashboard() {
  const { user } = useUser();

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome to the Dashboard page.</p>
      {user && (
        <div style={{marginTop:20}}>
          <h2>User Info</h2>
          <p><strong>Username:</strong> {user.username}</p>
          <p><strong>Email:</strong> {user.email}</p>
        </div>
      )}
    </div>
  );
}
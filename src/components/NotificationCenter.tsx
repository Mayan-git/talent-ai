/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { User, UserNotification } from "../types";
import { saasStore } from "../lib/saasStore";
import { Bell, Check, Trash } from "lucide-react";

interface NotificationCenterProps {
  user: User;
  onRefreshNotificationCount?: () => void;
}

export default function NotificationCenter({ user, onRefreshNotificationCount }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<UserNotification[]>([]);

  useEffect(() => {
    loadNotifications();
  }, [user.id]);

  const loadNotifications = () => {
    const db = saasStore.get();
    const userNotifs = db.notifications.filter(n => n.userId === user.id);
    setNotifications(userNotifs);
  };

  const markAsRead = (id: string) => {
    const db = saasStore.get();
    const notifIdx = db.notifications.findIndex(n => n.id === id);
    if (notifIdx !== -1) {
      db.notifications[notifIdx].read = true;
      saasStore.save(db);
    }
    loadNotifications();
    if (onRefreshNotificationCount) onRefreshNotificationCount();
  };

  const deleteNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const db = saasStore.get();
    db.notifications = db.notifications.filter(n => n.id !== id);
    saasStore.save(db);
    loadNotifications();
    if (onRefreshNotificationCount) onRefreshNotificationCount();
  };

  const markAllRead = () => {
    const db = saasStore.get();
    db.notifications = db.notifications.map(n => n.userId === user.id ? { ...n, read: true } : n);
    saasStore.save(db);
    loadNotifications();
    if (onRefreshNotificationCount) onRefreshNotificationCount();
  };

  return (
    <div id="notification-center-workspace" className="space-y-4 text-left max-w-sm w-full bg-[#141414] border border-white/5 p-4 rounded-xl shadow-3xl pointer-events-auto">
      
      <div className="flex justify-between items-center border-b border-white/5 pb-2">
        <div className="flex items-center gap-1.5">
          <Bell className="w-4 h-4 text-indigo-400" />
          <h4 className="font-display font-extrabold text-xs text-white">System Alerts Hub</h4>
        </div>
        {notifications.some(n => !n.read) && (
          <button
            onClick={markAllRead}
            className="text-[10px] font-mono text-indigo-400 hover:text-indigo-300 font-bold transition-all cursor-pointer"
          >
            Mark all read
          </button>
        )}
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {notifications.length === 0 ? (
          <p className="text-[10px] text-zinc-500 text-center py-6">No new alerts or suggestions found.</p>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => markAsRead(notif.id)}
              className={`p-3 rounded-lg border text-xs cursor-pointer transition-all flex justify-between items-start gap-4 ${
                notif.read ? "bg-[#111]/40 border-white/5" : "bg-indigo-500/5 border-indigo-500/10"
              }`}
            >
              <div className="space-y-0.5">
                <p className={`font-semibold text-zinc-200 ${notif.read ? "text-zinc-500" : "text-white"}`}>{notif.title}</p>
                <p className="text-[11px] text-zinc-400 leading-normal">{notif.message}</p>
                <span className="text-[9px] font-mono text-zinc-500 block mt-1">{new Date(notif.createdAt).toLocaleTimeString()}</span>
              </div>
              
              <div className="flex items-center shrink-0">
                {!notif.read && (
                  <button className="p-1 text-indigo-400 hover:text-indigo-300">
                    <Check className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={(e) => deleteNotification(notif.id, e)}
                  className="p-1 text-zinc-500 hover:text-red-400"
                >
                  <Trash className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          ))
        )}
      </div>

    </div>
  );
}

import type { Session, User } from "@supabase/supabase-js";
import { create } from "zustand";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import { toast } from "./useToastStore";

interface AuthState {
  user: User | null;
  session: Session | null;
  initialized: boolean;
  sendingLink: boolean;
  init: () => void;
  signInWithEmail: (email: string) => Promise<boolean>;
  signOut: () => Promise<void>;
}

let listenerBound = false;

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  initialized: false,
  sendingLink: false,

  // Idempotent — App.tsx calls this once on boot, but guard against a second
  // call (e.g. React StrictMode double-invoke) registering the auth listener twice.
  init: () => {
    if (!isSupabaseConfigured) {
      set({ initialized: true });
      return;
    }
    if (listenerBound) return;
    listenerBound = true;

    supabase.auth.getSession().then(({ data }) => {
      set({ session: data.session, user: data.session?.user ?? null, initialized: true });
    });
    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, user: session?.user ?? null, initialized: true });
    });
  },

  signInWithEmail: async (email) => {
    if (!isSupabaseConfigured) {
      toast.danger("云同步尚未配置");
      return false;
    }
    set({ sendingLink: true });
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    set({ sendingLink: false });
    if (error) {
      toast.danger(error.message || "发送登录邮件失败");
      return false;
    }
    toast.success("登录链接已发送，请查收邮箱（含垃圾邮件夹）");
    return true;
  },

  signOut: async () => {
    if (!isSupabaseConfigured) return;
    await supabase.auth.signOut();
    toast.info("已退出登录");
  },
}));

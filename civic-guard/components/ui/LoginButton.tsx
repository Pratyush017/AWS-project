"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { getCognitoGoogleLoginUrl, getCognitoLogoutUrl } from "@/lib/cognito";
import StarBorder from "@/components/ui/StarBorder";
import { LogOut } from "lucide-react";
import { StaggeredMenu } from "@/components/ui/StaggeredMenu";

interface Profile {
  points?: number;
  civic_points?: number;
  avatar_url?: string;
  name?: string;
  email?: string;
}

interface UserSession {
  user: {
    id: string;
    email?: string;
    name?: string;
  };
}

export function HeaderActions({ 
  onReportClick, 
  onHowItWorksClick,
  onSeverityScaleClick,
  onSeveritySelect
}: { 
  onReportClick: () => void,
  onHowItWorksClick: () => void,
  onSeverityScaleClick: () => void,
  onSeveritySelect?: (severity: number) => void
}) {
  const [session, setSession] = useState<UserSession | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [menuMode, setMenuMode] = useState<'main' | 'severity'>('main');

  const fetchUserAndProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setSession({ user: data.user });
          setProfile(data.profile || { points: 0 });
        } else {
          setSession(null);
          setProfile(null);
        }
      }
    } catch (e) {
      console.warn("Failed to fetch AWS Cognito session:", e);
    }
  }, []);

  useEffect(() => {
    fetchUserAndProfile();

    const handleUpdate = () => {
      fetchUserAndProfile();
    };

    window.addEventListener("civicPointsUpdate", handleUpdate);
    return () => {
      window.removeEventListener("civicPointsUpdate", handleUpdate);
    };
  }, [fetchUserAndProfile]);

  const handleSignIn = () => {
    const redirectUri = `${window.location.origin}/dashboard`;
    window.location.href = getCognitoGoogleLoginUrl(redirectUri);
  };

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    setSession(null);
    setProfile(null);
    window.location.href = getCognitoLogoutUrl(window.location.origin);
  };

  const mainMenuItems = [
    { label: "Report Issue", ariaLabel: "Report Issue", action: onReportClick },
    { label: "How It Works", ariaLabel: "How It Works guide", action: onHowItWorksClick },
    { label: "Severity Map", ariaLabel: "View Map Severity Scale", action: () => {
      setMenuMode('severity');
    }, preventClose: true },
    ...(session
      ? [{ label: "Sign Out", ariaLabel: "Sign out of your account", action: handleSignOut }]
      : [{ label: "Sign In", ariaLabel: "Sign in with Google", action: handleSignIn }])
  ];

  const severityMenuItems = [
    { label: "Low", ariaLabel: "Low Severity", action: () => onSeveritySelect?.(1), color: '#2dd4bf' },
    { label: "Medium", ariaLabel: "Medium Severity", action: () => onSeveritySelect?.(2), color: '#fbbf24' },
    { label: "High", ariaLabel: "High Severity", action: () => onSeveritySelect?.(3), color: '#f43f5e' },
    { label: "← Back", ariaLabel: "Go back", action: () => setMenuMode('main'), preventClose: true }
  ];

  const currentPoints = profile?.points ?? profile?.civic_points ?? 0;

  return (
    <div className="flex items-center gap-3">
      {session && (
        <StarBorder color="#22d3ee" speed="4s" className="text-cyan-400 font-semibold cursor-default">
          <div className="flex items-center gap-2 px-1">
            <span className="text-sm font-semibold tracking-wide text-cyan-300">
              {currentPoints} <span className="text-xs font-normal text-cyan-500 uppercase tracking-wider">pts</span>
            </span>
          </div>
        </StarBorder>
      )}

      {/* Modern Radial Staggered Action Menu */}
      <StaggeredMenu
        position="right"
        items={menuMode === 'main' ? mainMenuItems : severityMenuItems}
        colors={['#06b6d4', '#3b82f6', '#6366f1']}
        accentColor="#06b6d4"
        onMenuOpen={() => setMenuMode('main')}
      />

      {/* Fallback standard sign in button if preferred on certain breakpoints */}
      {!session ? (
        <Button
          onClick={handleSignIn}
          variant="outline"
          className="border-slate-700 hover:border-cyan-500/50 hover:bg-cyan-500/10 text-slate-300 hover:text-white transition-all text-xs font-medium cursor-pointer"
        >
          Sign In
        </Button>
      ) : (
        <Button
          onClick={handleSignOut}
          variant="ghost"
          size="icon"
          title="Sign Out"
          className="text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="size-4" />
        </Button>
      )}
    </div>
  );
}

export function LoginButton() {
  return (
    <HeaderActions 
      onReportClick={() => {}}
      onHowItWorksClick={() => {}}
      onSeverityScaleClick={() => {}}
    />
  );
}

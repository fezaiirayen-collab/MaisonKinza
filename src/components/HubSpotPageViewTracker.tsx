import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

type HubSpotQueueCommand = ["setPath", string] | ["trackPageView"];

declare global {
  interface Window {
    _hsq?: HubSpotQueueCommand[];
  }
}

const HubSpotPageViewTracker = () => {
  const { pathname, search, hash } = useLocation();
  const isInitialRender = useRef(true);
  const lastTrackedPath = useRef<string | undefined>(undefined);

  useEffect(() => {
    const path = `${pathname}${search}${hash}`;

    if (isInitialRender.current) {
      isInitialRender.current = false;
      lastTrackedPath.current = path;
      return;
    }

    if (lastTrackedPath.current === path) return;

    lastTrackedPath.current = path;
    const hubSpotQueue = (window._hsq = window._hsq || []);
    hubSpotQueue.push(["setPath", path]);
    hubSpotQueue.push(["trackPageView"]);
  }, [hash, pathname, search]);

  return null;
};

export default HubSpotPageViewTracker;

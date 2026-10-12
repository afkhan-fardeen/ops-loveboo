/** Lets any client code (pickers using router.push) start the top progress bar. */
export const startProgress = () => {
  if (typeof window !== "undefined") window.dispatchEvent(new Event("nav-start"));
};

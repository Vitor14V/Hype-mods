declare module './worker' {
  const worker: {
    start: () => void;
  };
  export default worker;
}
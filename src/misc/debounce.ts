const debounce = <Args extends any[]>(cb: (...args: Args) => void, delay = 250): ((...args: Args) => void) => {
  let timeout;

  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      cb(...args);
    }, delay);
  };
};

export default debounce;
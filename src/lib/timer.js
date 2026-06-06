export function createTimer(tickMs, onTick, onEnd) {
  let id = null;
  let left = 0;
  let running = false;

  function startInterval() {
    id = setInterval(() => {
      left = Math.max(0, left - tickMs);
      onTick(left / 1000);
      if (left <= 0) {
        clearInterval(id);
        running = false;
        onEnd();
      }
    }, tickMs);
  }

  return {
    start(seconds) {
      left = seconds * 1000;
      running = true;
      startInterval();
    },
    pause() {
      clearInterval(id);
      running = false;
    },
    resume() {
      if (left > 0 && !running) {
        running = true;
        startInterval();
      }
    },
    stop() {
      clearInterval(id);
      running = false;
      left = 0;
    },
    getLeft() {
      return left / 1000;
    },
  };
}

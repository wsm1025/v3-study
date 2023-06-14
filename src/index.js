function test(string) {
  let i;
  let startIndex, endIndex;
  let res = [];
  function waitA(char) {
    if (char === "a") {
      startIndex = i;
      return waitB;
    }
    return waitA;
  }
  function waitB(char) {
    if (char === "b") {
      return waitC;
    }
    return waitA;
  }
  function waitC(char) {
    if (char === "c") {
      endIndex = i;
      return waitEnd;
    }
    return waitA;
  }
  function waitEnd() {
    return waitEnd;
  }
  let currentState = waitA;
  for (i = 0; i < string.length; i++) {
    let nextState = currentState(string[i]);
    currentState = nextState;
    if (currentState === waitEnd) {
      console.log(startIndex, endIndex);
      res.push({
        startIndex,
        endIndex,
      });
      currentState = waitA;
    }
  }
}

console.log(test("dhabchfjabc"));

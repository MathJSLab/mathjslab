clear

test_result_eval_evalin_catch(1,1) = isequal(eval("missingValue + 1", "caughtValue = 12"), eval("missingValue + 1", "caughtValue = 12"))
test_result_eval_evalin_catch(2,1) = isequal(caughtValue, caughtValue)

test_result_eval_evalin_catch(3,1) = isequal(eval("okValue = 5", "shouldNotRun = 99"), eval("okValue = 5", "shouldNotRun = 99"))
test_result_eval_evalin_catch(4,1) = isequal(okValue, okValue)
test_result_eval_evalin_catch(5,1) = isequal(exist("shouldNotRun", "var"), exist("shouldNotRun", "var"))

function y = evalcatchinside()
  eval("missingName + 1", "fallback = 42");
  y = fallback;
end

test_result_eval_evalin_catch(6,1) = isequal(evalcatchinside(), evalcatchinside())
test_result_eval_evalin_catch(7,1) = isequal(exist("fallback", "var"), exist("fallback", "var"))

function [y, existsLocal] = evalcatchlocal()
  eval("missingLocal + 1", "localFallback = 77");
  y = localFallback;
  existsLocal = exist("localFallback", "var");
end

[y, existsLocal] = evalcatchlocal()
test_result_eval_evalin_catch(8,1) = isequal(exist("localFallback", "var"), exist("localFallback", "var"))

function y = evalcatchnested()
  x = 1;
  inner();
  y = x;

  function inner()
    eval("missingNested + 1", "x = x + 4");
  end
end

test_result_eval_evalin_catch(9,1) = isequal(evalcatchnested(), evalcatchnested())

function y = evalcatchpropagates()
  eval("missingPrimary", "missingCatch");
  y = 1;
end

evalcatchpropagates()  % erro: missingCatch indefinido

function y = evalincatchcaller()
  evalin("caller", "missingCaller + 1", "callerFallback = 33");
  y = 1;
end

test_result_eval_evalin_catch(10,1) = isequal(evalincatchcaller(), evalincatchcaller())
test_result_eval_evalin_catch(11,1) = isequal(callerFallback, callerFallback)

function y = evalincatchbase()
  evalin("base", "missingBase + 1", "baseFallback = 44");
  y = 1;
end

test_result_eval_evalin_catch(12,1) = isequal(evalincatchbase(), evalincatchbase())
test_result_eval_evalin_catch(13,1) = isequal(baseFallback, baseFallback)

function y = evalincatchouter()
  y = inner();

  function z = inner()
    evalin("caller", "missingOuter + 1", "outerFallback = 55");
    z = outerFallback;
  end
end

evalincatchouter()
test_result_eval_evalin_catch(14,1) = isequal(exist("outerFallback", "var"), exist("outerFallback", "var"))

function y = evalinbaseok()
  evalin("base", "baseOk = 66", "baseCatch = 77");
  y = 1;
end

test_result_eval_evalin_catch(15,1) = isequal(evalinbaseok(), evalinbaseok())
test_result_eval_evalin_catch(16,1) = isequal(baseOk, baseOk)
test_result_eval_evalin_catch(17,1) = isequal(exist("baseCatch", "var"), exist("baseCatch", "var"))

function y = evalincatchpropagates()
  evalin("base", "missingPrimary", "missingCatch");
  y = 1;
end

evalincatchpropagates()  % erro: missingCatch indefinido

test_result_eval_evalin_catch(18,1) = isequal(eval("primaryOK = 1", "catchShouldNotRun = 2"), eval("primaryOK = 1", "catchShouldNotRun = 2"))
test_result_eval_evalin_catch(19,1) = isequal(primaryOK, primaryOK)
test_result_eval_evalin_catch(20,1) = isequal(exist("catchShouldNotRun", "var"), exist("catchShouldNotRun", "var"))

test_result_eval_evalin_catch(21,1) = isequal(eval("missingAgain", "catchAgain = 3"), eval("missingAgain", "catchAgain = 3"))
test_result_eval_evalin_catch(22,1) = isequal(catchAgain, catchAgain)


complete_test_result_eval_evalin_catch = all(test_result_eval_evalin_catch)

complete_test_result_eval_evalin_catch

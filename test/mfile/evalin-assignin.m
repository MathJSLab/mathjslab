clear

x = 20

function y = readcallerexpr()
  x = 10;
  y = evalin("caller", "x + 1");
end

test_result_evalin_assignin(1,1) = isequal(readcallerexpr(), readcallerexpr())

function y = readbaseexpr()
  x = 10;
  y = evalin("base", "x + 1");
end

test_result_evalin_assignin(2,1) = isequal(readbaseexpr(), readbaseexpr())

function setcaller()
  assignin("caller", "createdByCaller", 99)
end

test_result_evalin_assignin(3,1) = isequal(setcaller(), setcaller())
test_result_evalin_assignin(4,1) = isequal(createdByCaller, createdByCaller)

function setbase()
  assignin("base", "createdByBase", 123)
end

test_result_evalin_assignin(5,1) = isequal(setbase(), setbase())
test_result_evalin_assignin(6,1) = isequal(createdByBase, createdByBase)

function y = outerassignin()
  innerassignin();
  y = localValue;

  function innerassignin()
    assignin("caller", "localValue", 7)
  end
end

test_result_evalin_assignin(7,1) = isequal(outerassignin(), outerassignin())
test_result_evalin_assignin(8,1) = isequal(exist("localValue", "var"), exist("localValue", "var"))

function y = outerevalin()
  localValue = 40;
  y = innerevalin();

  function z = innerevalin()
    z = evalin("caller", "localValue + 2");
  end
end

test_result_evalin_assignin(9,1) = isequal(outerevalin(), outerevalin())

function y = evalinassigns()
  evalin("caller", "madeByEvalin = 55");
  y = 1;
end

test_result_evalin_assignin(10,1) = isequal(evalinassigns(), evalinassigns())
test_result_evalin_assignin(11,1) = isequal(madeByEvalin, madeByEvalin)

function y = evalinbaseassigns()
  evalin("base", "madeInBase = 77");
  y = 1;
end

test_result_evalin_assignin(12,1) = isequal(evalinbaseassigns(), evalinbaseassigns())
test_result_evalin_assignin(13,1) = isequal(madeInBase, madeInBase)

function y = assigncomputed()
  value = 5;
  assignin("caller", "computedValue", value + 10)
  y = 0;
end

test_result_evalin_assignin(14,1) = isequal(assigncomputed(), assigncomputed())
test_result_evalin_assignin(15,1) = isequal(computedValue, computedValue)

test_result_evalin_assignin(16,1) = isequal(evalin("base", "x + createdByCaller + createdByBase"), evalin("base", "x + createdByCaller + createdByBase"))

evalin("unknown", "1")          % erro: workspace nao suportado
assignin("base", "bad-name", 1) % erro: nome de variavel invalido
assignin("base", "x")           % erro: chamada invalida

clear

function y = readcallerx()
  y = evalin("caller", "x");
end

f = @(x) readcallerx()
test_result_evalin_assignin(17,1) = isequal(f(10), f(10))

x = 99
test_result_evalin_assignin(18,1) = isequal(readcallerx(), readcallerx())

function y = evalinlambdaouter()
  x = 7;
  f = @(t) evalin("caller", "x + 1");
  y = f(3);
end

test_result_evalin_assignin(19,1) = isequal(evalinlambdaouter(), evalinlambdaouter())

function y = evalinlambdaarg()
  f = @(x) evalin("caller", "x + 5");
  y = f(20);
end

test_result_evalin_assignin(20,1) = isequal(evalinlambdaarg(), evalinlambdaarg())

function y = evalinreturnedlambda()
  x = 30;
  f = makereadcallerlambda();
  y = f(1);
end

function f = makereadcallerlambda()
  f = @(t) evalin("caller", "x + t");
end

test_result_evalin_assignin(21,1) = isequal(evalinreturnedlambda(), evalinreturnedlambda())

function y = assigninlambdaouter()
  f = @() assignin("caller", "createdInOuter", 9);
  f();
  y = createdInOuter;
end

test_result_evalin_assignin(22,1) = isequal(assigninlambdaouter(), assigninlambdaouter())
test_result_evalin_assignin(23,1) = isequal(exist("createdInOuter", "var"), exist("createdInOuter", "var"))

function y = assigninlambdaarg()
  f = @(x) assignin("caller", "createdInLambda", x + 1);
  f(40);
  y = createdInLambda;
end

test_result_evalin_assignin(24,1) = isequal(assigninlambdaarg(), assigninlambdaarg())
test_result_evalin_assignin(25,1) = isequal(exist("createdInLambda", "var"), exist("createdInLambda", "var"))

function y = evalinbasefromlambda()
  x = 1;
  f = @() evalin("base", "baseValue + 1");
  y = f();
end

baseValue = 100
test_result_evalin_assignin(26,1) = isequal(evalinbasefromlambda(), evalinbasefromlambda())

test_result_evalin_assignin(27,1) = isequal(evalin("caller", "baseValue"), evalin("caller", "baseValue"))


complete_test_result_evalin_assignin = all(test_result_evalin_assignin)

complete_test_result_evalin_assignin

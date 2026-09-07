clear % clear all variables

clear

function y = outercallbefore(x)
  a = 10;
  y = inner(x);

  function z = inner(t)
    z = t + a;
  end
end

test_result_inner_function(1,1) = isequal(outercallbefore(5), outercallbefore(5))


function y = outerwrite()
  a = 1;
  inner();
  y = a;

  function inner()
    a = 5;
  end
end

test_result_inner_function(2,1) = isequal(outerwrite(), outerwrite())
test_result_inner_function(3,1) = isequal(outerwrite(), outerwrite())


function y = outershadow()
  a = 10;
  y = inner(3) + a;

  function z = inner(a)
    a = a + 1;
    z = a;
  end
end

test_result_inner_function(4,1) = isequal(outershadow(), outershadow())


function y = outerreturnupdate()
  y = 1;
  bump();

  function bump()
    y = y + 1;
  end
end

test_result_inner_function(5,1) = isequal(outerreturnupdate(), outerreturnupdate())


function y = outernoleak()
  y = inner();

  function z = inner()
    z = 1;
  end
end

test_result_inner_function(6,1) = isequal(outernoleak(), outernoleak())
inner()   % erro: função aninhada não deve vazar para o escopo global


function y = nestedwithreturn(x)
  y = inner(x);

  function z = inner(t)
    if t < 0
      z = 0;
      return
    end
    z = t;
  end
end

test_result_inner_function(7,1) = isequal(nestedwithreturn(-5), nestedwithreturn(-5))
test_result_inner_function(8,1) = isequal(nestedwithreturn(7), nestedwithreturn(7))


function y = nestedpersistent()
  y = bump();

  function z = bump()
    persistent c = 0;
    c = c + 1;
    z = c;
  end
end

test_result_inner_function(9,1) = isequal(nestedpersistent(), nestedpersistent())
test_result_inner_function(10,1) = isequal(nestedpersistent(), nestedpersistent())
test_result_inner_function(11,1) = isequal(nestedpersistent(), nestedpersistent())


clear

clear

function f = makenested(a)
  function z = inner(x)
    z = x + a;
  end
  f = @inner;
end

h = makenested(10)
test_result_inner_function(12,1) = isequal(h(5), h(5))

function f = makecounter()
  c = 0;
  function z = bump()
    c = c + 1;
    z = c;
  end
  f = @bump;
end

h = makecounter()
test_result_inner_function(13,1) = isequal(h(), h())
test_result_inner_function(14,1) = isequal(h(), h())
test_result_inner_function(15,1) = isequal(h(), h())

h1 = makecounter()
h2 = makecounter()
test_result_inner_function(16,1) = isequal(h1(), h1())
test_result_inner_function(17,1) = isequal(h1(), h1())
test_result_inner_function(18,1) = isequal(h2(), h2())
test_result_inner_function(19,1) = isequal(h1(), h1())
test_result_inner_function(20,1) = isequal(h2(), h2())

function f = makeadder(a)
  function y = add(x)
    y = x + a;
  end
  f = @add;
end

add3 = makeadder(3)
add10 = makeadder(10)
test_result_inner_function(21,1) = isequal(add3(7), add3(7))
test_result_inner_function(22,1) = isequal(add10(7), add10(7))

function [inc, get] = makestate()
  value = 0;
  function y = increment()
    value = value + 1;
    y = value;
  end
  function y = current()
    y = value;
  end
  inc = @increment;
  get = @current;
end

[inc, get] = makestate()
test_result_inner_function(23,1) = isequal(get(), get())
test_result_inner_function(24,1) = isequal(inc(), inc())
test_result_inner_function(25,1) = isequal(inc(), inc())
test_result_inner_function(26,1) = isequal(get(), get())

function f = makeparamshadow(a)
  function y = inner(a)
    a = a + 1;
    y = a;
  end
  f = @inner;
end

shadow = makeparamshadow(100)
test_result_inner_function(27,1) = isequal(shadow(5), shadow(5))

function f = makeouterwriter()
  y = 1;
  function z = bump()
    y = y + 1;
    z = y;
  end
  f = @bump;
end

writer = makeouterwriter()
test_result_inner_function(28,1) = isequal(writer(), writer())
test_result_inner_function(29,1) = isequal(writer(), writer())

clear

test_result_inner_function(30,1) = isequal(func2str(@sin), func2str(@sin))

f = str2func("sin")
test_result_inner_function(31,1) = isequal(f(0), f(0))

g = str2func("@(x) x + 1")
test_result_inner_function(32,1) = isequal(g(4), g(4))

test_result_inner_function(33,1) = isequal(func2str(g), func2str(g))

info = functions(@sin)
test_result_inner_function(34,1) = isequal(info.function, info.function)
test_result_inner_function(35,1) = isequal(info.type, info.type)
test_result_inner_function(36,1) = isequal(info.workspace, info.workspace)

info = functions(@(x) x + 1)
test_result_inner_function(37,1) = isequal(info.function, info.function)
test_result_inner_function(38,1) = isequal(info.type, info.type)
test_result_inner_function(39,1) = isequal(info.workspace, info.workspace)

function h = makenestedhandle(a)
  function y = inner(x)
    y = x + a;
  end
  h = @inner;
end

h = makenestedhandle(10)
test_result_inner_function(40,1) = isequal(h(5), h(5))

test_result_inner_function(41,1) = isequal(func2str(h), func2str(h))

info = functions(h)
test_result_inner_function(42,1) = isequal(info.function, info.function)
test_result_inner_function(43,1) = isequal(info.type, info.type)
test_result_inner_function(44,1) = isequal(info.workspace, info.workspace)

function [h1, h2] = makepair()
  value = 0;
  function y = inc()
    value = value + 1;
    y = value;
  end
  function y = get()
    y = value;
  end
  h1 = @inc;
  h2 = @get;
end

[inc, get] = makepair()
test_result_inner_function(45,1) = isequal(functions(inc), functions(inc))
test_result_inner_function(46,1) = isequal(functions(get), functions(get))
test_result_inner_function(47,1) = isequal(get(), get())
test_result_inner_function(48,1) = isequal(inc(), inc())
test_result_inner_function(49,1) = isequal(inc(), inc())
test_result_inner_function(50,1) = isequal(get(), get())


complete_test_result_inner_function = all(test_result_inner_function)

complete_test_result_inner_function

clear

function y = localfirst(x)
  y = x + 1;
end

function y = localsecond(x)
  y = x + 2;
end

c = localfunctions()
test_result_localfunctions(1,1) = isequal(func2str(c{1}), func2str(c{1}))
test_result_localfunctions(2,1) = isequal(func2str(c{2}), func2str(c{2}))
test_result_localfunctions(3,1) = isequal(feval(c{1}, 10), feval(c{1}, 10))
test_result_localfunctions(4,1) = isequal(feval(c{2}, 10), feval(c{2}, 10))

h = c{1}
test_result_localfunctions(5,1) = isequal(h(20), h(20))
test_result_localfunctions(6,1) = isequal(which(h), which(h))
test_result_localfunctions(7,1) = isequal(functions(h), functions(h))

function [name, y, kind, workspace] = outermakehandles(a)
  c = localfunctions();
  h = c{1};
  info = functions(h);
  name = func2str(h);
  y = h(5);
  kind = info.type;
  workspace = info.workspace;

  function z = inner(x)
    z = x + a;
  end
end

[name, y, kind, workspace] = outermakehandles(10)

function [y1, y2] = outertwo(a)
  c = localfunctions();
  h1 = c{1};
  h2 = c{2};
  y1 = h1(5);
  y2 = h2(5);

  function z = addbase(x)
    z = x + a;
  end

  function z = mulbase(x)
    z = x * a;
  end
end

[y1, y2] = outertwo(3)

function names = nestednames()
  c = localfunctions();
  names = {func2str(c{1}), func2str(c{2})};

  function y = alpha()
    y = 1;
  end

  function y = beta()
    y = 2;
  end
end

test_result_localfunctions(8,1) = isequal(nestednames(), nestednames())

function y = nestedwithstate()
  count = 0;
  c = localfunctions();
  bump = c{1};
  y = bump() + bump();

  function z = inc()
    count = count + 1;
    z = count;
  end
end

test_result_localfunctions(9,1) = isequal(nestedwithstate(), nestedwithstate())
test_result_localfunctions(10,1) = isequal(nestedwithstate(), nestedwithstate())

localfunctions(1)  % erro: chamada inválida


complete_test_result_localfunctions = all(test_result_localfunctions)

complete_test_result_localfunctions

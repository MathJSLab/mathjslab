clear

function [current, caller] = stackcaller()
  [current, caller] = stackleaf();
end

function [current, caller] = stackleaf()
  s = dbstack();
  current = s(1).name;
  caller = s(2).name;
end

[current, caller] = stackcaller()

function caller = stackskipcaller()
  caller = stackskipleaf();
end

function caller = stackskipleaf()
  s = dbstack(1);
  caller = s(1).name;
end

test_result_dbstack(1,1) = isequal(stackskipcaller(), stackskipcaller())

function [current, caller] = stacknested()
  [current, caller] = inner();

  function [a, b] = inner()
    s = dbstack();
    a = s(1).name;
    b = s(2).name;
  end
end

[current, caller] = stacknested()

function [name1, line1, file1] = stackfields()
  s = dbstack();
  name1 = s(1).name;
  line1 = s(1).line;
  file1 = s(1).file;
end

[name1, line1, file1] = stackfields()

function [a, b] = stackthree()
  [a, b] = middle();

  function [x, y] = middle()
    [x, y] = leaf();

    function [p, q] = leaf()
      s = dbstack();
      p = s(1).name;
      q = s(2).name;
    end
  end
end

[a, b] = stackthree()

function n = stacklength()
  s = dbstack();
  n = length(s);
end

test_result_dbstack(2,1) = isequal(stacklength(), stacklength())

function n = stacklengthnested()
  n = inner();

  function y = inner()
    s = dbstack();
    y = length(s);
  end
end

test_result_dbstack(3,1) = isequal(stacklengthnested(), stacklengthnested())

function caller = stackoption()
  caller = stackoptionleaf();
end

function caller = stackoptionleaf()
  s = dbstack(1, "-completenames");
  caller = s(1).name;
end

test_result_dbstack(4,1) = isequal(stackoption(), stackoption())

dbstack(1.5)      % erro: contador deve ser inteiro nao negativo
dbstack(-1)       % erro: contador deve ser inteiro nao negativo
dbstack("badopt") % erro: opcao nao suportada

clear

function [current, caller] = stackthroughanon()
  f = @() stackleafstack();
  s = f();
  current = s(1).name;
  caller = s(2).name;
end

function s = stackleafstack()
  s = dbstack();
end

[current, caller] = stackthroughanon()

function caller = stackskipanon()
  f = @() dbstack(1);
  s = f();
  caller = s(1).name;
end

test_result_dbstack(5,1) = isequal(stackskipanon(), stackskipanon())

function [current, caller] = stackthroughfeval()
  f = @() stackleafstack();
  s = feval(f);
  current = s(1).name;
  caller = s(2).name;
end

[current, caller] = stackthroughfeval()

function [current, caller, outer] = stacknestedanon()
  f = @() inner();
  s = f();
  current = s(1).name;
  caller = s(2).name;
  outer = s(3).name;

  function s = inner()
    s = dbstack();
  end
end

[current, caller, outer] = stacknestedanon()

function y = stackerrorleaf()
  y = missingStackValue;
end

f = @() stackerrorleaf()
feval(f)               % erro esperado: stack deve conter stackerrorleaf e @anonymous function handle

test_result_dbstack(6,1) = isequal(dbstack(), dbstack())

f = @() dbstack()
s = f()
test_result_dbstack(7,1) = isequal(s(1).name, s(1).name)

f = @() dbstack("-completenames")
s = f()
test_result_dbstack(8,1) = isequal(s(1).name, s(1).name)


complete_test_result_dbstack = all(test_result_dbstack)

complete_test_result_dbstack

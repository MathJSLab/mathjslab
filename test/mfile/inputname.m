clear

function [first, second, third, fourth] = namesofinputs(x, y, z)
  first = inputname(1);
  second = inputname(2);
  third = inputname(3);
  fourth = inputname(4);
end

a = 10
b = 20

[first, second, third, fourth] = namesofinputs(a, b, a)
[first, second, third, fourth] = namesofinputs(a, b + 1, 30)
[first, second, third, fourth] = namesofinputs(10, a, b)

function name = singleinputname(x)
  name = inputname(1);
end

test_result_inputname(1,1) = isequal(singleinputname(a), singleinputname(a))
test_result_inputname(2,1) = isequal(singleinputname(a + 1), singleinputname(a + 1))
test_result_inputname(3,1) = isequal(singleinputname(100), singleinputname(100))

function [name1, name2, count] = varargininputnames(x, varargin)
  name1 = inputname(1);
  name2 = inputname(2);
  count = nargin;
end

test_result_inputname(4,1) = isequal(varargininputnames(a), varargininputnames(a))
test_result_inputname(5,1) = isequal(varargininputnames(a, b), varargininputnames(a, b))
test_result_inputname(6,1) = isequal(varargininputnames(a, b + 1), varargininputnames(a, b + 1))

function name = outerinputname(x)
  name = inner(x);

  function y = inner(value)
    y = inputname(1);
  end
end

test_result_inputname(7,1) = isequal(outerinputname(a), outerinputname(a))
test_result_inputname(8,1) = isequal(outerinputname(5), outerinputname(5))

function [outername, innername] = twolevelinputname(x)
  outername = inputname(1);
  innername = inner(x);

  function y = inner(value)
    y = inputname(1);
  end
end

[outername, innername] = twolevelinputname(a)
[outername, innername] = twolevelinputname(5)

function y = badinputname(n)
  y = inputname(n);
end

test_result_inputname(9,1) = isequal(badinputname(1), badinputname(1))
test_result_inputname(10,1) = isequal(badinputname(2), badinputname(2))
badinputname(0)    % erro: indice deve ser inteiro positivo
badinputname(1.5)  % erro: indice deve ser inteiro positivo

inputname(1)       % erro: inputname so e valido dentro de funcao


complete_test_result_inputname = all(test_result_inputname)

complete_test_result_inputname

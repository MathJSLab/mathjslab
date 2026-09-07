clear
A.x = [2,3,4]
A.y = 2
A.z = 3
test_result_structure(1,1) = isequal(A, A)
A(1,5).x=999
test_result_structure(2,1) = isequal(A(1,1).x(1,2), A(1,1).x(1,2))
B=[true,false,false,true,true]
C=A(B)
test_result_structure(3,1) = isequal(struct('test', 3, 'boo', 99), struct('test', 3, 'boo', 99))
test_result_structure(4,1) = isequal(A.x, A.x)
test_result_structure(5,1) = isequal(ans, ans)

clear

% metadados
test_result_structure(6,1) = isequal(nargin("struct"), nargin("struct"))
test_result_structure(7,1) = isequal(nargout("struct"), nargout("struct"))

% struct vazio
s0 = struct()
test_result_structure(8,1) = isequal(class(s0), class(s0))
test_result_structure(9,1) = isequal(isstruct(s0), isstruct(s0))

% struct com pares campo/valor
s = struct("a", 1, "b", [2, 3], "name", "mathjslab")
test_result_structure(10,1) = isequal(s.a, s.a)
test_result_structure(11,1) = isequal(s.b, s.b)
test_result_structure(12,1) = isequal(s.name, s.name)

% copia de struct
t = struct(s)
test_result_structure(13,1) = isequal(t.a, t.a)
test_result_structure(14,1) = isequal(t.b, t.b)
test_result_structure(15,1) = isequal(t.name, t.name)

% struct usado em funcao
function y = readstructfield(s)
  y = s.a + s.b(2);
end

test_result_structure(16,1) = isequal(readstructfield(s), readstructfield(s))

% struct como retorno
function s = makestruct(x)
  s = struct("value", x, "doubleValue", 2*x);
end

r = makestruct(5)
test_result_structure(17,1) = isequal(r.value, r.value)
test_result_structure(18,1) = isequal(r.doubleValue, r.doubleValue)

struct(1, 2) % error
struct("a", 1, 2, 3) % error


complete_test_result_structure = all(test_result_structure)

complete_test_result_structure

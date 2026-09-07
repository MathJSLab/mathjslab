clear

% aridade e metadados
test_result_builtin_meshgrid_ndgrid(1,1) = isequal(nargin("meshgrid"), nargin("meshgrid"))
test_result_builtin_meshgrid_ndgrid(2,1) = isequal(nargout("meshgrid"), nargout("meshgrid"))
test_result_builtin_meshgrid_ndgrid(3,1) = isequal(nargin("ndgrid"), nargin("ndgrid"))
test_result_builtin_meshgrid_ndgrid(4,1) = isequal(nargout("ndgrid"), nargout("ndgrid"))

% meshgrid 2-D basico
[X, Y] = meshgrid(1:3, 4:5)
test_result_builtin_meshgrid_ndgrid(5,1) = isequal(X, X)
test_result_builtin_meshgrid_ndgrid(6,1) = isequal(Y, Y)

% meshgrid com um unico vetor
[A, B] = meshgrid(1:3)
test_result_builtin_meshgrid_ndgrid(7,1) = isequal(A, A)
test_result_builtin_meshgrid_ndgrid(8,1) = isequal(B, B)

% meshgrid 3-D
[X3, Y3, Z3] = meshgrid(1:2, 3:4, 5:6)
test_result_builtin_meshgrid_ndgrid(9,1) = isequal(size(X3), size(X3))
test_result_builtin_meshgrid_ndgrid(10,1) = isequal(size(Y3), size(Y3))
test_result_builtin_meshgrid_ndgrid(11,1) = isequal(size(Z3), size(Z3))

% ndgrid 2-D
[N1, N2] = ndgrid(1:2, 3:4)
test_result_builtin_meshgrid_ndgrid(12,1) = isequal(N1, N1)
test_result_builtin_meshgrid_ndgrid(13,1) = isequal(N2, N2)

% ndgrid com um unico vetor e duas saidas
[U, V] = ndgrid(1:3)
test_result_builtin_meshgrid_ndgrid(14,1) = isequal(U, U)
test_result_builtin_meshgrid_ndgrid(15,1) = isequal(V, V)

% ndgrid 3-D
[A3, B3, C3] = ndgrid(1:2, 3:4, 5:6)
test_result_builtin_meshgrid_ndgrid(16,1) = isequal(size(A3), size(A3))
test_result_builtin_meshgrid_ndgrid(17,1) = isequal(size(B3), size(B3))
test_result_builtin_meshgrid_ndgrid(18,1) = isequal(size(C3), size(C3))

meshgrid() % error
meshgrid(1, 2, 3, 4) % error
ndgrid() % error


complete_test_result_builtin_meshgrid_ndgrid = all(test_result_builtin_meshgrid_ndgrid)

complete_test_result_builtin_meshgrid_ndgrid

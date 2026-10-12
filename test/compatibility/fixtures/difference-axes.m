% Explicit axes agree across MATLAB/Octave; pages use column-major storage.
A=[1,3,6;2,5,9];
P=reshape(1:12,[2,2,3]);
compatible=isequal(diff(A,1,1),[1,2,3]) && isequal(diff(A,1,2),[2,3;3,4]) && isequal(diff(P,1,3),4*ones(2,2,2));
compatible

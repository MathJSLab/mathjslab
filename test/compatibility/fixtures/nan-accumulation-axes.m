% Each matrix row and each N-D line has its own accumulator.
A=[NaN,2,NaN;3,NaN,4];
P=reshape([NaN,2,3,NaN,5,6,NaN,8],[2,2,2]);
compatible=isequal(cumsum(A,2,"reverse","omitnan"),[2,2,0;7,4,4]);
compatible=compatible && isequal(cumprod(A,2,"omitnan"),[1,2,2;3,3,12]);
compatible=compatible && isequal(reshape(cumsum(P,3,"reverse","omitnan"),1,8),[5,8,3,8,5,6,0,8]);
compatible

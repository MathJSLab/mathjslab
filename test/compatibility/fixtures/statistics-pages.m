A=reshape(1:8,[2,2,2]);
M=mean(A,[1,2]);
V=var(A,0,[1,2]);
S=std(A,1,[1,2]);
compatible=isequal(size(M),[1,1,2]) && isequal(reshape(M,1,2),[2.5,6.5]) && max(abs(reshape(V,1,2)-[5/3,5/3]))<1e-12 && max(abs(reshape(S,1,2)-sqrt([1.25,1.25])))<1e-12 && isequal(A,reshape(1:8,[2,2,2]));
compatible

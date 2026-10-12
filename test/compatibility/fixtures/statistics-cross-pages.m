A=reshape(1:16,[2,2,2,2]);
M=mean(A,[3;1]);
V=var(A,0,[1,3]);
S=std(A,1,[3,1]);
compatible=isequal(size(M),[1,2,1,2]) && isequal(reshape(M,1,4),[3.5,5.5,11.5,13.5]) && max(abs(reshape(V,1,4)-(17/3)*ones(1,4)))<1e-12 && max(abs(reshape(S,1,4)-sqrt(4.25)*ones(1,4)))<1e-12 && var([1e16,1e16+2],0,[1,2])==2 && var([1+i,3+3i],1,[2,1])==2;
compatible

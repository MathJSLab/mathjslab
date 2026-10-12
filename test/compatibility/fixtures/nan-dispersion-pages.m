P=reshape([NaN,2,3,NaN,5,NaN,7,8],2,2,2);
V=var(P,0,3,"omitnan");
S=std(P,1,3,"omitnan");
E=var(zeros(0,3));
B=var([NaN,7],0,4,"omitnan");
compatible=isequal(V,[0,8;0,0]) && isequal(S,[0,2;0,0]) && isequal(size(var(P,0,1,"omitnan")),[1,2,2]) && isequal(size(E),[1,3]) && all(isnan(E)) && isequal(size(std(zeros(2,0,3),0,1)),[1,0,3]) && isnan(B(1)) && B(2)==0;
compatible

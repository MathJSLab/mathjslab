A=[5,-4,6;2,3,9;-1,1,2];
W=[0.5,0.25,0.25];
[V,M]=var(A,W);
compatible=max(abs(V-[6.1875,9.5,6.1875]))<1e-12 && isequal(M,[2.75,-1,5.75]);
[S,N]=std(A,W');
compatible=compatible && max(abs(S-sqrt(V)))<1e-12 && isequal(M,N);
[V,M]=var([1,NaN,3],[1,9,3],2,"omitnan");
compatible=compatible && abs(V-0.75)<1e-12 && abs(M-2.5)<1e-12;
P=reshape(1:8,[2,2,2]);
[V,M]=var(P,[1,3],3);
compatible=compatible && max(abs(V(:)-3))<1e-12 && isequal(M,[4,6;5,7]);
B=[1,NaN,1;3,5,NaN];
[V,M]=var(B,[1,3],1,"omitnan");
compatible=compatible && max(abs(V-[0.75,0,0]))<1e-12 && isequal(M,[2.5,5,1]);
compatible

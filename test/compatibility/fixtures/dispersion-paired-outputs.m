A=reshape(1:8,[2,2,2]);
[V,M]=var(A,0,[1,3]);
[S,N]=std(A,1,[1,2]);
compatible=max(abs(V-[17/3,17/3]))<1e-12 && isequal(M,[3.5,5.5]);
compatible=compatible && isequal(N,reshape([2.5,6.5],[1,1,2])) && max(abs(reshape(S,1,2)-sqrt([1.25,1.25])))<1e-12;
[V,M]=var([1+i,complex(NaN,2),3+3i],0,"omitnan");
compatible=compatible && V==4 && M==2+2i;
[V,M]=var([],0,"all");
compatible=compatible && isnan(V) && isnan(M);
compatible

% Selected empty axes create identities; unselected empty axes remain empty.
E=zeros(0,3,2);
compatible=isequal(sum(E,[1,3]),[0,0,0]) && isequal(prod(E,[3,1]),[1,1,1]);
compatible=compatible && isequal(size(sum(zeros(2,0,3),[1,3])),[1,0]);
N=reshape([NaN,NaN,1,2,NaN,NaN,3,4],[2,2,2]);
compatible=compatible && isequal(sum(N,[1,3],"omitnan"),[0,10]) && isequal(prod(N,[3,1],"omitnan"),[1,24]);
z=[1+i,complex(2,NaN);2+i,complex(NaN,3)];
compatible=compatible && sum(z,[1,2],"omitnan")==3+2i && prod(z,[2,1],"omitnan")==1+3i;
compatible=compatible && isnan(sum([Inf,1;-Inf,2],[1,2],"omitnan"));
compatible=compatible && sum([],[1,2])==0 && prod([],[2,1])==1;
compatible

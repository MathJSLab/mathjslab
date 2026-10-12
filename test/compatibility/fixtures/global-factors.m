% Product of page-wise factors, and complex values with missing components.
P=reshape([1,2,3,4,1,2,1,3],[2,2,2]);
z=[1+i,complex(2,NaN);2+i,complex(NaN,3)];
compatible=prod(P,"all")==144 && sum(P,"all")==17;
compatible=compatible && sum(z,"all","omitnan")==3+2i && prod(z,"all","omitnan")==1+3i;
compatible=compatible && imag(prod(complex(Inf,2),"all"))==2;
compatible=compatible && prod(P,"all")==prod(P(:)) && sum(P,"all")==sum(P(:));
compatible

% Compare totals by row/column across pages and keep unselected axes in place.
P=reshape(1:8,[2,2,2]);
compatible=isequal(sum(P,[3,1]),[14,22]) && isequal(prod(P,[1,3]),[60,672]);
compatible=compatible && isequal(sum(P,[2,3]),[16;20]) && isequal(prod(P,[3;2]),[105;384]);
Q=reshape(1:16,[2,2,2,2]);
compatible=compatible && isequal(size(sum(Q,[1,3])),[1,2,1,2]);
compatible=compatible && isequal(reshape(sum(Q,[1,3]),1,4),[14,22,46,54]);
compatible=compatible && sum(P,[3,2,1,9])==sum(P,"all") && prod(P,[1,2,3])==prod(P,"all");
compatible

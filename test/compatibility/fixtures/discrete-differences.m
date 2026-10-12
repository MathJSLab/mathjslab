% Position samples: velocity differences, then constant acceleration.
p=[0,1,4,9];
v=diff(p);
a=diff(p,2);
compatible=isequal(v,[1,3,5]) && isequal(a,[2,2]) && isequal(p,[0,1,4,9]);
compatible

-- Removes the first level-1 heading; the title comes from the document metadata.
local done = false
function Header(h)
  if not done and h.level == 1 then done = true; return {} end
end

export function bufferVisualClass(label) {
  const classes = {
    "Large cutoff buffer": "buffer-large",
    "Medium cutoff buffer": "buffer-medium",
    "Small cutoff buffer": "buffer-small",
    "Small cutoff gap": "buffer-small-gap",
    "Medium cutoff gap": "buffer-medium-gap",
    "Large cutoff gap": "buffer-large-gap",
  };
  return classes[label] || "buffer-unknown";
}

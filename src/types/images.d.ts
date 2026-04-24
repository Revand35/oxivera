declare module "*.JPG" {
  const content: import("next/image").StaticImageData;
  export default content;
}

declare module "*.JPEG" {
  const content: import("next/image").StaticImageData;
  export default content;
}

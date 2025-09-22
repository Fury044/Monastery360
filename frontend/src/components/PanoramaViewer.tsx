type Props = {
  imageUrl: string;
};

export default function PanoramaViewer({ imageUrl }: Props) {
  return (
    <div className="w-full h-96 bg-black overflow-hidden flex items-center justify-center">
      {/* Minimal viewer: render the image. Replace with a 360 library later. */}
      <img src={imageUrl} alt="Panorama" className="w-full h-full object-cover" />
    </div>
  );
}

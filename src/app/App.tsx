import Section from "../imports/Section";
import { DottedSurface } from "./components/ui/dotted-surface";

export default function App() {
  return (
    <div className="w-full min-h-screen bg-[#060809] overflow-x-hidden">
      <Section />
      <DottedSurface className="opacity-60 fixed top-[calc(100vh-300px)] left-0 right-0 h-[605px] z-10 pointer-events-none" />
    </div>
  );
}
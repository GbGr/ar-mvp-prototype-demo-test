import './ExploreContainer.css';
import ARScene from './ARScene'

interface ContainerProps {
  name: string;
}

const ExploreContainer: React.FC<ContainerProps> = ({ name }) => {
  return (
    <ARScene />
  );
};

export default ExploreContainer;
import { IonContent, IonFooter, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import ExploreContainer from '../components/ExploreContainer';
import './Home.css';
import PageFooter from '../components/PageFooter';

const Home: React.FC = () => {
  return (
    <IonPage>
      <IonContent fullscreen>
        <ExploreContainer />
      </IonContent>
      <IonFooter>
        <PageFooter />
      </IonFooter>
    </IonPage>
  );
};

export default Home;

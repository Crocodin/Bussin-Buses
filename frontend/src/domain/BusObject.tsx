import UserObject from './UserObject';

interface BusObject {
  id: number;
  name: string;
  description: string;
  imageUrls: string[];
  location: string;
  user: UserObject;
  timestamp: string;
}

export default BusObject;
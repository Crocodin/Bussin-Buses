import BusObject from "../domain/BusObject";
import UserObject from "../domain/UserObject";

const mocUsers: UserObject[] = [
  {
    id: 1,
    username: "user1",
    profilePictureUrl: "./src/data/demo_profile_pic.jpg",
  },
];

const mocPosts: BusObject[] = [
  {
    id: 1,
    name: "Bus 1",
    description: "This is the first bus.",
    imageUrls: ["./src/data/20260905_193932.jpg", "./src/data/20260905_193922.jpg"],
    location: "./src/data/google-placeholder.png",
    user: mocUsers[0],
    timestamp: "2023-10-01 12:00:00",
  },
  {
    id: 2, 
    name: "Bus 2",
    description: "This is the second bus.",
    imageUrls: ["./src/data/20260905_193932.jpg"],
    location: "./src/data/google-placeholder.png",
    user: mocUsers[0],
    timestamp: "2023-10-01 13:00:00",
  },
];


export { mocPosts, mocUsers };
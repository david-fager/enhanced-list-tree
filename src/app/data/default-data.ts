import {NodeData} from "./node-data";

export var defaultData: NodeData = {
  id: "default-root",
  isExpanded: true,
  content: [ "Root" ],
  children: [
    {
      id: "default-leaf-1",
      isExpanded: true,
      content: [ "Leaf 1" ],
      children: [],
    },
    {
      id: "default-branch",
      isExpanded: true,
      content: [ "Branch 1" ],
      children: [
        {
          id: "default-leaf-2",
          isExpanded: true,
          content: [ "Leaf 2" ],
          children: [],
        },
        {
          id: "default-leaf-3",
          isExpanded: true,
          content: [ "Leaf 3" ],
          children: [],
        },
      ],
    },
    {
      id: "default-leaf-4",
      isExpanded: true,
      content: [ "Leaf 4" ],
      children: [],
    },
  ],
}

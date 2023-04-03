import {DataNode} from "./data-node";

export var dataDefault: DataNode[] = [
  {
    id: "default-root",
    isExpanded: true,
    content: [{ showOptions: false, text: "Root", isEditing: false }],
    children: [
      {
        id: "default-branch",
        isExpanded: true,
        content: [{ showOptions: false, text: "Branch", isEditing: false }],
        children: [
          {
            id: "default-leaf-1",
            isExpanded: true,
            content: [{ showOptions: false, text: "Leaf 1", isEditing: false }],
            children: [],
          },
          {
            id: "default-leaf-2",
            isExpanded: true,
            content: [{ showOptions: false, text: "Leaf 2", isEditing: false }],
            children: [],
          },
        ],
      },
      {
        id: "default-leaf-3",
        isExpanded: true,
        content: [{ showOptions: false, text: "Leaf 3", isEditing: false }],
        children: [],
      },
    ],
  },
]

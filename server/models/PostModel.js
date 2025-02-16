const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
    },
    image: {
      public_id: {
        type: String,
      },
      url: {
        type: String,
      },
    },
    user: {
      type: Object,
    },
    likes: [
      {
        name: {
          type: String,
        },
        userName: {
          type: String,
        },
        userId: {
          type: String,
        },
        userAvatar: {
          type: String,
        },
      },
    ],
    shares: [
      {
        name: {
          type: String,
        },
        userName: {
          type: String,
        },
        userId: {
          type: String,
        },
        userAvatar: {
          type: String,
        },
        created_at: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    replies: [
      {
        user: {
          type: Object,
        },
        title: {
          type: String,
        },
        image: {
          public_id: {
            type: String,
          },
          url: {
            type: String,
          },
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
        likes: [
          {
            name: {
              type: String,
            },
            userName: {
              type: String,
            },
            userId: {
              type: String,
            },
            userAvatar: {
              type: String,
            },
          },
        ],
        reply: [
          {
            user: {
              type: Object,
            },
            title: {
              type: String,
            },
            image: {
              public_id: {
                type: String,
              },
              url: {
                type: String,
              },
            },
            createdAt: {
              type: Date,
              default: Date.now,
            },
            likes: [
              {
                name: {
                  type: String,
                },
                userName: {
                  type: String,
                },
                userId: {
                  type: String,
                },
                userAvatar: {
                  type: String,
                },
              },
            ],
          },
        ],
      },
    ],
    userInteractions: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        score: {
          type: Number,
          default: 0,
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Post", postSchema);

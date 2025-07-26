import mongoose, { Schema } from "mongoose";

const tweetSchema = new Schema(
    {
        content: {
            type: String,
            required: true,
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
    },
    {
        timestamps: true,
    }
);

// tweetSchema.index({ title: 1, owner: 1 }, { unique: true });

export const Tweet = mongoose.model("Tweet", tweetSchema);
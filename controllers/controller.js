const {
  Campaign,
  CampaignCategory,
  Category,
  Donation,
  Profile,
  User,
} = require("../models");
const { Op, where } = require("sequelize");
const bcrypt = require("bcryptjs");
const formatRupiah = require("../helpers/helper");
const { sendDonationReceipt } = require("../helpers/mailer");

class Controller {
  // ===== PUBLIC =====
  static async home(req, res) {
    try {
      res.render("Home");
    } catch (error) {
      res.send(error);
    }
  }

  static async getRegister(req, res) {
    try {
      const { errors } = req.query;
      res.render("register", { errors });
    } catch (error) {
      res.send(error);
    }
  }

  static async postRegister(req, res) {
    try {
      const { userName, email, password, role } = req.body;
      await User.create({ userName, email, password, role });
      res.redirect("/login");
    } catch (error) {
      if (error.name === "SequelizeValidationError") {
        let errors = error.errors.map((el) => el.message);
        res.redirect(`/register?errors=${errors}`);
      } else {
        res.send(error);
      }
    }
  }

  static async getLogin(req, res) {
    try {
      const { invalid } = req.query;
      res.render("login", { invalid });
    } catch (error) {
      res.send(error);
    }
  }

  static async postLogin(req, res) {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.redirect("/login?invalid=Email atau password salah");
      }

      const ok = await bcrypt.compare(password, user.password);
      if (!ok) {
        return res.redirect("/login?invalid=Email atau password salah");
      }

      // set session
      req.session.user = {
        id: user.id,
        userName: user.userName,
        role: user.role,
      };

      // redirect by role
      if (user.role === "User") {
        return res.redirect(`/userHome/${user.id}`);
      } else {
        return res.redirect(`/adminHome/${user.id}`);
      }
    } catch (error) {
      res.send(error);
    }
  }

  static logout(req, res) {
    req.session.destroy(() => {
      res.clearCookie("connect.sid");
      res.redirect("/login");
    });
  }

  // ===== USER AREA =====
  static async getProfile(req, res) {
    try {
      res.render("getProfile");
    } catch (error) {
      res.send(error);
    }
  }

  static async postProfile(req, res) {
    try {
      const { id } = req.params;
      const { fullName, avatarUrl, phoneNumber, address } = req.body;
      await Profile.create({
        UserId: id,
        fullName,
        avatarUrl,
        phoneNumber,
        address,
      });
      res.redirect(`/userHome/${id}`);
    } catch (error) {
      res.send(error);
    }
  }

  static async getEditProfile(req, res) {
    try {
      const { id } = req.params;
      let profile = await User.findOne({
        where: {
          id,
        },
        include: {
          model: Profile,
        },
      });
      res.render("getEditProfile", { profile });
    } catch (error) {
      res.send(error);
    }
  }

  static async postEditProfile(req, res) {
    try {
      const { id } = req.params;
      const { fullName, avatarUrl, phoneNumber, address, profileId } = req.body;

      let profile = await Profile.findByPk(profileId);
      await profile.update({
        fullName,
        avatarUrl,
        phoneNumber,
        address,
        UserId: id,
      });

      res.redirect(`/myProfile/${id}`);
    } catch (error) {
      res.send(error);
    }
  }

  static async myProfile(req, res) {
    try {
      const { id } = req.params;
      const profile = await Profile.findOne({ where: { UserId: id } });
      const user = await User.findByPk(id);

      if (profile) {
        res.render("myProfile", { profile });
      } else {
        res.render("getProfile", { user });
      }
    } catch (error) {
      res.send(error);
    }
  }

  static async myDonations(req, res) {
    try {
      const { id } = req.params;
      const donation = await Donation.findAll({
        where: { UserId: id },
        include: { model: Campaign },
      });

      res.render("myDonations", { donation, id, formatRupiah });
    } catch (error) {
      res.send(error);
    }
  }

  static async myCampaigns(req, res) {
    try {
      const { msg } = req.query;
      const { id } = req.params;
      const campaign = await Campaign.findAll({ where: { UserId: id } });
      res.render("myCampaigns", { campaign, id, msg });
    } catch (error) {
      res.send(error);
    }
  }

  static async campaignList(req, res) {
    try {
      const { search, success, error, preview } = req.query;
      const { id } = req.params;

      const baseFind = {
        order: [["createdAt", "DESC"]],
        include: { model: CampaignCategory, include: { model: Category } },
      };

      let campaigns;
      if (search) {
        campaigns = await Campaign.findAll({
          ...baseFind,
          where: { title: { [Op.iLike]: `%${search}%` } },
        });
      } else {
        campaigns = await Campaign.findAll(baseFind);
      }

      const successArr = success ? [success] : [];
      const errorArr = error ? [error] : [];

      res.render("campaignList", {
        campaigns,
        id,
        search: search || "",
        formatRupiah,
        success: successArr,
        error: errorArr,
        preview: preview || "",
      });
    } catch (error) {
      res.send(error);
    }
  }

  static async getCampaign(req, res) {
    try {
      const { errors } = req.query;
      const { id } = req.params;
      const category = await Category.findAll();
      res.render("addCampaign", { id, category, errors });
    } catch (error) {
      res.send(error);
    }
  }

  static async postCampaign(req, res) {
    try {
      const { id } = req.params;
      const { title, description, goalAmount, startDate, endDate, CategoryId } =
        req.body;

      const newCamp = await Campaign.create({
        UserId: id,
        title,
        description,
        goalAmount,
        startDate,
        endDate,
      });

      if (Array.isArray(CategoryId)) {
        const data = CategoryId.map((catId) => ({
          CampaignId: newCamp.id,
          CategoryId: catId,
        }));
        await CampaignCategory.bulkCreate(data);
      } else if (CategoryId) {
        await CampaignCategory.create({ CampaignId: newCamp.id, CategoryId });
      }

      res.redirect(`/campaignList/${id}`);
    } catch (error) {
      const { id } = req.params;
      if (error.name === "SequelizeValidationError") {
        let errors = error.errors.map((el) => el.message);
        res.redirect(`/addCampaign/${id}?errors=${errors}`);
      } else {
        res.send(error);
      }
    }
  }

  static async getDonate(req, res) {
    try {
      const { errors } = req.query;
      const { userId, campaignId } = req.params;
      const campaign = await Campaign.findByPk(campaignId);
      res.render("donate", { campaign, userId, errors });
    } catch (error) {
      res.send(error);
    }
  }

  static async postDonate(req, res) {
    try {
      const { userId, campaignId } = req.params;
      const { amount, message } = req.body;

      const amountNum = Number(amount) || 0;

      // 1) Simpan donasi
      const donation = await Donation.create({
        UserId: userId,
        CampaignId: campaignId,
        amount: amountNum,
        message,
      });

      // 2) Update progress campaign
      const campaign = await Campaign.findByPk(campaignId);
      await campaign.update({
        currentAmount: Number(campaign.currentAmount || 0) + amountNum,
      });

      // 3) Kirim email tanda terima (Ethereal preview)
      let successMsg = "Donasi berhasil.";
      let errorMsg = "";
      let previewUrlParam = "";

      try {
        const user = await User.findByPk(userId);

        const when = new Intl.DateTimeFormat("id-ID", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          timeZone: "Asia/Jakarta",
        }).format(new Date(donation.createdAt || Date.now()));

        const { previewUrl } = await sendDonationReceipt(user.email, {
          userName: user.userName,
          campaignTitle: campaign.title,
          amount: amountNum,
          when,
        });

        if (previewUrl) {
          // kirim via query terpisah supaya bisa dijadikan link di EJS
          previewUrlParam = `&preview=${encodeURIComponent(previewUrl)}`;
        }
      } catch (mailErr) {
        console.error("Gagal kirim email:", mailErr);
        errorMsg = "Email tanda terima gagal dikirim.";
      }

      // 4) Redirect + pesan via query string
      let url = `/campaignList/${userId}?success=${encodeURIComponent(
        successMsg
      )}`;
      if (errorMsg) url += `&errors=${encodeURIComponent(errorMsg)}`;
      url += previewUrlParam;

      return res.redirect(url);
    } catch (error) {
      console.error(error);
      const { userId, campaignId } = req.params;

      if (error.name === "SequelizeValidationError") {
        const messages = error.errors.map((e) => e.message).join(" | ");
        return res.redirect(
          `/donate/${userId}/${campaignId}?errors=${encodeURIComponent(
            messages
          )}`
        );
      }

      return res.status(500).send(error);
    }
  }

  static async deleteCampaign(req, res) {
    try {
      const { campaignId, userId } = req.params;
      const campaign = await Campaign.findByPk(campaignId);
      if (!campaign) return res.status(404).send("Campaign tidak ditemukan");
      await campaign.destroy();
      let msg = `${campaign.title} has been removed`;
      res.redirect(`/myCampaign/${userId}?msg=${msg}`);
    } catch (error) {
      res.send(error);
    }
  }

  // ===== ADMIN AREA =====
  static async adminCampaign(req, res) {
    try {
      const campaigns = await Campaign.findAll({
        order: [["createdAt", "DESC"]],
      });
      res.render("adminCampaignList", { campaigns, formatRupiah });
    } catch (error) {
      res.send(error);
    }
  }

  static async adminDeleteCampaign(req, res) {
    try {
      const { campaignId } = req.params;
      const campaign = await Campaign.findByPk(campaignId);
      if (!campaign) return res.status(404).send("Campaign tidak ditemukan");
      await campaign.destroy();
      res.redirect("/adminCampaignList");
    } catch (error) {
      res.send(error);
    }
  }

  static async userList(req, res) {
    try {
      const users = await User.findAll({
        order: [["id", "DESC"]],
        where: { role: "User" },
      });
      res.render("userList", { users });
    } catch (error) {
      res.send(error);
    }
  }

  static async deleteUser(req, res) {
    try {
      const { userId } = req.params;
      const user = await User.findByPk(userId);
      if (!user) return res.status(404).send("User tidak ditemukan");
      await user.destroy();
      res.redirect("/userList");
    } catch (error) {
      res.send(error);
    }
  }

  static async donationList(req, res) {
    try {
      const donations = await Donation.listAllAdmin();
      res.render("donationList", { donations, formatRupiah });
    } catch (error) {
      res.send(error);
    }
  }
}

module.exports = Controller;

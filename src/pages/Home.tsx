import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, FileText, Image, Film } from 'lucide-react';
import { useTranslation, Trans } from 'react-i18next';

const Home: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-20">
      {/* Hero Section */}
      <section className="text-center space-y-8 py-20">
        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight">
          <Trans i18nKey="home.hero.title">
            Create TVC Ads with <span className="text-blue-600">AI Speed</span>
          </Trans>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          {t('home.hero.subtitle')}
        </p>
        <div className="flex justify-center gap-4">
          <Link to="/dashboard" className="bg-blue-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-blue-700 transition flex items-center gap-2">
            {t('home.hero.startCreating')} <ArrowRight className="w-5 h-5" />
          </Link>
          <Link to="/works" className="bg-white text-gray-700 border border-gray-300 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-50 transition">
            {t('home.hero.viewGallery')}
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="grid md:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-6">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold mb-3">{t('home.features.script.title')}</h3>
          <p className="text-gray-600">{t('home.features.script.desc')}</p>
        </div>
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
          <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center mb-6">
            <Image className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold mb-3">{t('home.features.storyboard.title')}</h3>
          <p className="text-gray-600">{t('home.features.storyboard.desc')}</p>
        </div>
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
          <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center mb-6">
            <Film className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold mb-3">{t('home.features.video.title')}</h3>
          <p className="text-gray-600">{t('home.features.video.desc')}</p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 text-white rounded-3xl p-12 text-center space-y-6">
        <h2 className="text-3xl font-bold">{t('home.cta.title')}</h2>
        <p className="text-blue-100 max-w-xl mx-auto">{t('home.cta.desc')}</p>
        <Link to="/register" className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition">
          {t('home.cta.button')}
        </Link>
      </section>
    </div>
  );
};

export default Home;
